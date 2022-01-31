import dataUrl from 'url:./word-data.json';
import remainingCountUrl from 'url:./initial-remaining-counts.json';
import {
  GuessAnalysis,
  FiveLetters,
  Clue,
  RemainingResult,
  RemainingAnswers,
  CellColors,
} from 'shared-types/index';

type WordDataType = typeof import('./word-data.json');
let wordData: Promise<WordDataType> | undefined;
const getWordData = (): Promise<WordDataType> =>
  wordData || (wordData = fetch(dataUrl).then((res) => res.json()));

let allWords: Promise<string[]> | undefined;
const getAllWords = () =>
  allWords ||
  (allWords = getWordData().then((data) => [...data.common, ...data.other]));

let initialRemainingAverages: Promise<RemainingResult> | undefined;
const getInitialRemainingAverages = () =>
  initialRemainingAverages ||
  (initialRemainingAverages = fetch(remainingCountUrl).then((res) =>
    res.json(),
  ));

const threadPorts: MessagePort[] = [];

/**
 * Generate the clues given by a particular guess.
 */
function generateClue(answer: string, guess: string): Clue {
  const remainingAnswerLetters = [...answer];
  const positionalMatches: FiveLetters = ['', '', '', '', ''];
  const positionalNotMatches: FiveLetters = ['', '', '', '', ''];
  const additionalRequiredLetters: string[] = [];
  const remainingMustNotContain = new Set<string>();

  // Green squares take priority over yellow squares,
  // so those need to be resolved first.
  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i];

    // If there's an exact positional match,
    // This is a green square in Wordle.
    if (answer[i] === letter) {
      remainingAnswerLetters.splice(remainingAnswerLetters.indexOf(letter), 1);
      // Valid answers must also have this positional match
      positionalMatches[i] = letter;
    }
  }

  for (let i = 0; i < guess.length; i++) {
    // If we've already handled this with a green square, skip.
    if (positionalMatches[i]) continue;

    const letter = guess[i];
    // Otherwise, if the answer contains the letter (and it hasn't already been matched).
    // This is a yellow square in Wordle.
    if (remainingAnswerLetters.includes(letter)) {
      remainingAnswerLetters.splice(remainingAnswerLetters.indexOf(letter), 1);
      // Valid answers must not have this positional match, otherwise it'd be a green square
      positionalNotMatches[i] = letter;
      // Valid answers must contain this letter
      additionalRequiredLetters.push(letter);
    }
    // The guess letter isn't in remainingAnswerLetters.
    // It might still be in the answer, but we already know about it via a green or yellow square.
    // This catches cases where 'brass' is guessed and the answer is 'trash'.
    // The first 's' will be recorded in positionalMatches, but since we've landed here for the 2nd 's',
    // we know the answer only contains one 's'.
    else {
      remainingMustNotContain.add(letter);
    }
  }

  return {
    positionalMatches,
    positionalNotMatches,
    additionalRequiredLetters,
    remainingMustNotContain,
  };
}

export function generateBlockColors(
  positionalMatches: FiveLetters,
  positionalNotMatches: FiveLetters,
): string {
  let result = '';

  for (let i = 0; i < positionalMatches.length; i++) {
    if (positionalMatches[i]) {
      // Green
      result += 'c';
    } else if (positionalNotMatches[i]) {
      // Yellow
      result += 'p';
    } else {
      // Blank
      result += 'a';
    }
  }

  return result;
}

/**
 * Does an answer comply with a set of conditions?
 *
 * @param answer The answer to check
 * @param positionalMatches Array like ['', 'b', 'b', '', ''] representing known letters + position. Empty string means unknown.
 * @param positionalNotMatches Array like ['c', 'a', '', '', 's'] representing letters + position that are known to be incorrect. Empty string means unknown.
 * @param additionalRequiredLetters Array of letters that are known to be in one of the spaces that isn't covered by positionalMatches.
 * @param remainingMustNotContain Set of letters that must not appear in the answer once other rules have been processed.
 * @returns
 */
function possibleAnswer(
  answer: string,
  positionalMatches: FiveLetters,
  positionalNotMatches: FiveLetters,
  additionalRequiredLetters: string[],
  remainingMustNotContain: Set<string>,
): boolean {
  const additionalRequiredLettersCopy = additionalRequiredLetters.slice();

  for (let i = 0; i < answer.length; i++) {
    const letter = answer[i];

    if (positionalMatches[i]) {
      if (positionalMatches[i] !== letter) return false;
      // If we have an exact positional match, this letter is valid and no further checks are needed.
      continue;
    }

    if (positionalNotMatches[i] && letter === positionalNotMatches[i]) {
      return false;
    }

    const index = additionalRequiredLettersCopy.indexOf(letter);

    if (index !== -1) {
      additionalRequiredLettersCopy.splice(index, 1);
    } else if (remainingMustNotContain.has(letter)) {
      // remainingMustNotContain is only checked if the letter is not found in positionalMatches or additionalRequiredLettersCopy.
      // This allows a letter to appear in positionalMatches and/or additionalRequiredLetters, and remainingMustNotContain.
      // Eg, if additionalRequiredLetters contains 's' and remainingMustNotContain contains 's', this ensures the answer must contain one 's'.
      return false;
    }
  }

  // It's valid if we've used up all the letters we need to
  return additionalRequiredLettersCopy.length === 0;
}

/**
 * Figure out the average number of possibilities remaining for a particular guess.
 */
function getRemainingAverages(
  remainingAnswers: RemainingAnswers,
  guesses: string[],
  progressPort?: MessageEventSource,
): RemainingResult {
  const counts = {
    common: guesses.map((guess) => [guess, []]) as [string, number[]][],
    all: guesses.map((guess) => [guess, []]) as [string, number[]][],
  };
  const allAnswers = [...remainingAnswers.common, ...remainingAnswers.other];

  for (const [i, guess] of guesses.entries()) {
    const remainingCache: {
      [key: string]:
        | [commonRemaining: number, allRemaining: number]
        | undefined;
    } = {};

    for (const answer of allAnswers) {
      const {
        positionalMatches,
        positionalNotMatches,
        additionalRequiredLetters,
        remainingMustNotContain,
      } = generateClue(answer, guess);

      const key = generateBlockColors(positionalMatches, positionalNotMatches);

      if (remainingCache[key]) {
        counts.common[i][1].push(remainingCache[key]![0]);
        counts.all[i][1].push(remainingCache[key]![1]);
        continue;
      }

      let validAnswers = 0;
      let validCommonAnswers = 0;

      for (const [answerIndex, answer] of allAnswers.entries()) {
        if (
          possibleAnswer(
            answer,
            positionalMatches,
            positionalNotMatches,
            additionalRequiredLetters,
            remainingMustNotContain,
          )
        ) {
          validAnswers++;
          if (answerIndex < remainingAnswers.common.length) {
            validCommonAnswers++;
          }
        }
      }

      counts.common[i][1].push(validCommonAnswers);
      counts.all[i][1].push(validAnswers);
      remainingCache[key] = [validCommonAnswers, validAnswers];
    }

    if (progressPort) progressPort.postMessage('answer-done');
  }

  // Convert the list of counts to averages
  return Object.fromEntries(
    Object.entries(counts).map(([key, counts]) => [
      key,
      counts.map(([guess, counts]) => [
        guess,
        counts.reduce((a, b) => a + b, 0) / counts.length,
      ]),
    ]),
  ) as RemainingResult;
}

/** Multithreaded version of getRemainingAverages */
async function getRemainingAveragesMT(
  remainingAnswers: RemainingAnswers,
): Promise<RemainingResult> {
  if (threadPorts.length === 0) {
    throw Error('No worker threads available');
  }

  const guesses = await getAllWords();

  let done = 0;
  const expected = guesses.length;

  const groupSize = Math.ceil(guesses.length / threadPorts.length);
  const guessesGroups = Array.from({ length: threadPorts.length }, (_, i) =>
    guesses.slice(i * groupSize, (i + 1) * groupSize),
  );

  const resultSets = await Promise.all(
    guessesGroups.map(
      (guessesGroup, i) =>
        new Promise<RemainingResult>((resolve, reject) => {
          const port = threadPorts[i];
          port.postMessage({
            action: 'get-remaining-averages',
            remainingAnswers,
            guesses: guessesGroup,
          });

          function portListener({ data: message }: MessageEvent) {
            if (message === 'answer-done') {
              done++;
              self.postMessage({ type: 'progress', done, expected });
              return;
            }
            if (message.type === 'error') {
              reject(message.error);
              port.removeEventListener('message', portListener);
              return;
            }
            if (message.type === 'done') {
              resolve(message.result);
              port.removeEventListener('message', portListener);
              return;
            }
          }

          port.addEventListener('message', portListener);
        }),
    ),
  );

  // Combine results and sort in acending order
  return Object.fromEntries(
    (['common', 'all'] as const).map((key) => [
      key,
      resultSets
        .map((resultSet) => resultSet[key])
        .flat()
        .sort((a, b) => a[1] - b[1]),
    ]),
  ) as RemainingResult;
}

export function getBestPlay(
  remainingAnswers: RemainingAnswers,
  remainingResult: RemainingResult,
): string {
  if (remainingAnswers.common.length > 4) {
    // Pick the answer that eliminates most common words
    return remainingResult.common[0][0];
  }
  if (remainingAnswers.common.length !== 0) {
    // Go for a common-word win
    return remainingResult.common.find(([word]) =>
      remainingAnswers.common.includes(word),
    )![0];
  }
  if (remainingAnswers.other.length > 4) {
    // Pick the answer that eliminates most words
    return remainingResult.all[0][0];
  }
  // Go for a win
  return remainingResult.all.find(([word]) =>
    remainingAnswers.other.includes(word),
  )![0];
}

async function analyzeGuess(
  guess: string,
  answer: string,
  previousClues: Clue[],
  remainingAnswers?: RemainingAnswers,
): Promise<GuessAnalysis> {
  let remainingAverages: RemainingResult | undefined;

  if (!remainingAnswers) {
    [remainingAnswers, remainingAverages] = await Promise.all([
      getWordData(),
      getInitialRemainingAverages(),
    ]);
  }

  const allWords = await getAllWords();

  const guessInDictionary = allWords.includes(guess);
  const clue = generateClue(answer, guess);

  if (!remainingAverages) {
    remainingAverages = await getRemainingAveragesMT(remainingAnswers);
  }

  const aiGuess = getBestPlay(remainingAnswers, remainingAverages);
  const aiClue = generateClue(answer, aiGuess);

  const newRemainingAnswers = Object.fromEntries(
    Object.entries(remainingAnswers).map(([key, answers]) => [
      key,
      answers.filter((word) =>
        possibleAnswer(
          word,
          clue.positionalMatches,
          clue.positionalNotMatches,
          clue.additionalRequiredLetters,
          clue.remainingMustNotContain,
        ),
      ),
    ]),
  ) as RemainingAnswers;

  return {
    guessInDictionary,
    clue,
    remainingAnswers: newRemainingAnswers,
    plays: (
      [
        [guess, clue],
        [aiGuess, aiClue],
      ] as const
    ).map(([guess, clue]) => ({
      guess,
      colors: generateBlockColors(
        clue.positionalMatches,
        clue.positionalNotMatches,
      ).split('') as CellColors,
      // TODO: more of this
    })),
  };
}

function messageListener(event: MessageEvent) {
  if (event.data.action === 'listen-to-port') {
    const port = event.data.port as MessagePort;
    port.addEventListener('message', messageListener);
    port.start();
    return;
  }
  if (event.data.action === 'add-thread-ports') {
    const ports = event.data.ports as MessagePort[];
    threadPorts.push(...ports);
    for (const port of ports) port.start();
    return;
  }
  if (event.data.action === 'get-remaining-averages') {
    const remainingAnswers = event.data.remainingAnswers;
    const guesses = event.data.guesses;

    const result = getRemainingAverages(
      remainingAnswers,
      guesses,
      event.source!,
    );
    event.source!.postMessage({
      action: 'get-remaining-averages-done',
      result,
    });
    return;
  }
}

addEventListener('message', messageListener);
