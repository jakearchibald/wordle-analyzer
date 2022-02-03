import dataUrl from 'url:./word-data.json';
import remainingAveragesUrl from 'url:./initial-remaining-averages.json';
import {
  GuessAnalysis,
  FiveLetters,
  Clue,
  RemainingResult,
  RemainingAnswers,
  CellColors,
  PlayAnalysis,
  AIPlay,
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
  (initialRemainingAverages = fetch(remainingAveragesUrl).then((res) =>
    res.json(),
  ));

let commonWordSet: Promise<Set<string>> | undefined;
const getCommonWordSet = () =>
  commonWordSet ||
  (commonWordSet = getWordData().then((data) => new Set(data.common)));

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

function validHardModeGuess(guess: string, clues: Clue[]): boolean {
  // Hard mode in wordle means:
  // Green letters must be played in their correct position
  // Yellow letters must be used in the remaining squares
  let requiredLetters = '';
  const positionalMatches: FiveLetters = ['', '', '', '', ''];

  for (const clue of clues) {
    let newRequiredLetters = clue.additionalRequiredLetters.join('');

    // Flatten positional matches
    for (const [i, positionalMatch] of clue.positionalMatches.entries()) {
      if (positionalMatch) {
        positionalMatches[i] = positionalMatch;
        newRequiredLetters += positionalMatch;
      }
    }

    // Required letters may have already been captured.
    // Dedupe by removing ones we've already found:
    for (const letter of newRequiredLetters) {
      requiredLetters = requiredLetters.replace(letter, '');
    }
    // Add the new letters to the end.
    requiredLetters += newRequiredLetters;
  }

  // Now check the guess:
  // First, required letters:
  let requiredLettersRemaining = requiredLetters;
  for (const letter of guess) {
    requiredLettersRemaining = requiredLettersRemaining.replace(letter, '');
  }

  if (requiredLettersRemaining.length !== 0) return false;

  // Now positional matches:
  for (const [i, positionalMatch] of positionalMatches.entries()) {
    if (positionalMatch && positionalMatch !== guess[i]) return false;
  }

  return true;
}

const numberWithOrdinal = ['1st', '2nd', '3rd', '4th', '5th'];

function getUnusedClues(guess: string, clues: Clue[]): string[] {
  const unusedClues = new Set<string>();

  for (const clue of clues) {
    const additionalRequiredLettersCopy =
      clue.additionalRequiredLetters.slice();

    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];

      if (clue.positionalMatches[i]) {
        if (clue.positionalMatches[i] !== letter) {
          unusedClues.add(
            `The ${
              numberWithOrdinal[i]
            } letter must be "${clue.positionalMatches[i].toUpperCase()}"`,
          );
        } else {
          continue;
        }
      } else if (
        clue.positionalNotMatches[i] &&
        letter === clue.positionalNotMatches[i]
      ) {
        unusedClues.add(
          `The ${
            numberWithOrdinal[i]
          } letter must not be be "${clue.positionalNotMatches[
            i
          ].toUpperCase()}"`,
        );
      }

      const index = additionalRequiredLettersCopy.indexOf(letter);

      if (index !== -1) {
        additionalRequiredLettersCopy.splice(index, 1);
      } else if (clue.remainingMustNotContain.has(letter)) {
        // remainingMustNotContain is only checked if the letter is not found in positionalMatches or additionalRequiredLettersCopy.
        // This allows a letter to appear in positionalMatches and/or additionalRequiredLetters, and remainingMustNotContain.
        // Eg, if additionalRequiredLetters contains 's' and remainingMustNotContain contains 's', this ensures the answer must contain one 's'.
        unusedClues.add(
          `The guess contains too many "${letter.toUpperCase()}"s`,
        );
      }
    }

    for (const unusedLetter of additionalRequiredLettersCopy) {
      unusedClues.add(
        `The guess contains too few "${unusedLetter.toUpperCase()}"s`,
      );
    }
  }

  return [...unusedClues];
}

/**
 * Figure out the average number of possibilities remaining for a particular guess.
 */
function getRemainingAverages(
  remainingAnswers: RemainingAnswers,
  guesses: string[],
  onAnswerDone?: () => void,
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

    if (onAnswerDone) onAnswerDone();
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
  onProgress: (done: number, expecting: number) => void,
): Promise<RemainingResult> {
  if (threadPorts.length === 0) {
    throw Error('No worker threads available');
  }

  const guesses = await getAllWords();

  let done = 0;
  const expecting = guesses.length;

  const groupSize = Math.ceil(guesses.length / threadPorts.length);
  const guessesGroups = Array.from({ length: threadPorts.length }, (_, i) =>
    guesses.slice(i * groupSize, (i + 1) * groupSize),
  );

  const resultSets = await Promise.all(
    guessesGroups.map(
      (guessesGroup, i) =>
        new Promise<RemainingResult>((resolve, reject) => {
          const mainPort = threadPorts[i];
          const { port1, port2 } = new MessageChannel();
          mainPort.postMessage(
            {
              action: 'get-remaining-averages',
              remainingAnswers,
              guesses: guessesGroup,
              returnPort: port2,
            },
            [port2],
          );

          port1.addEventListener(
            'message',
            ({ data: message }: MessageEvent) => {
              if (message === 'progress') {
                done++;
                onProgress(done, expecting);
                return;
              }
              if (message.action === 'error') {
                reject(message.error);
                port1.close();
                return;
              }
              if (message.action === 'done') {
                resolve(message.result);
                port1.close();
                return;
              }
            },
          );

          port1.start();
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
  // Focus on the common words first.
  for (const [remaining, bestGuesses] of [
    [remainingAnswers.common, remainingResult.common] as const,
    [remainingAnswers.other, remainingResult.all] as const,
  ]) {
    // Ran out of common answers.
    if (remaining.length === 0) continue;

    const bestGuess = bestGuesses[0];

    // Try to find a guess that's still a remaining answer.
    for (const guess of bestGuesses) {
      // If the remaining answers don't eliminate enough, just go with the best guess.
      if (guess[1] - bestGuess[1] > 0.5) return bestGuess[0];
      // Otherwise, go with a guess that's also a remaining answer.
      if (remaining.includes(guess[0])) return guess[0];
    }
  }

  throw Error('No remaining answers');
}

function getPlayAnalysis(
  guess: string,
  answer: string,
  previousClues: Clue[],
  remainingAnswers: RemainingAnswers,
  remainingAverages: RemainingResult,
  commonWords: Set<string>,
): PlayAnalysis {
  const clue = generateClue(answer, guess);

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

  const commonRemainingResult = remainingAverages.common.find(
    (item) => item[0] === guess,
  );
  const allRemainingResult = remainingAverages.all.find(
    (item) => item[0] === guess,
  );

  return {
    guess,
    clue,
    colors: generateBlockColors(
      clue.positionalMatches,
      clue.positionalNotMatches,
    ).split('') as CellColors,
    validForHardMode: validHardModeGuess(guess, previousClues),
    unusedClues: getUnusedClues(guess, previousClues),
    remainingAnswers: newRemainingAnswers,
    averageRemaining:
      commonRemainingResult && allRemainingResult
        ? {
            common: commonRemainingResult[1],
            all: allRemainingResult[1],
          }
        : undefined,
    commonWord: commonWords.has(guess),
  };
}

async function analyzeGuess(
  guess: string,
  answer: string,
  previousClues: Clue[],
  remainingAnswers: RemainingAnswers | undefined,
  onProgress: (done: number, expecting: number) => void,
): Promise<GuessAnalysis> {
  let remainingAverages: RemainingResult | undefined;

  if (!remainingAnswers) {
    [remainingAnswers, remainingAverages] = await Promise.all([
      getWordData(),
      getInitialRemainingAverages(),
    ]);
  }

  if (!remainingAverages) {
    remainingAverages = await getRemainingAveragesMT(
      remainingAnswers,
      onProgress,
    );
  }

  const commonWords = await getCommonWordSet();
  const aiGuess = getBestPlay(remainingAnswers, remainingAverages);
  const userPlay = getPlayAnalysis(
    guess,
    answer,
    previousClues,
    remainingAnswers,
    remainingAverages,
    commonWords,
  );
  const aiPlay =
    aiGuess === guess
      ? userPlay
      : getPlayAnalysis(
          aiGuess,
          answer,
          previousClues,
          remainingAnswers,
          remainingAverages,
          commonWords,
        );

  return {
    beforeRemainingCounts: {
      common: remainingAnswers.common.length,
      other: remainingAnswers.other.length,
    },
    plays: { user: userPlay, ai: aiPlay },
  };
}

async function getAiPlay(
  answer: string,
  previousClues: Clue[],
  remainingAnswers: RemainingAnswers | undefined,
  onProgress: (done: number, expecting: number) => void,
): Promise<AIPlay> {
  let remainingAverages: RemainingResult | undefined;

  if (!remainingAnswers) {
    [remainingAnswers, remainingAverages] = await Promise.all([
      getWordData(),
      getInitialRemainingAverages(),
    ]);
  }

  if (!remainingAverages) {
    remainingAverages = await getRemainingAveragesMT(
      remainingAnswers,
      onProgress,
    );
  }

  const commonWords = await getCommonWordSet();
  const guess = getBestPlay(remainingAnswers, remainingAverages);
  const play = getPlayAnalysis(
    guess,
    answer,
    previousClues,
    remainingAnswers,
    remainingAverages,
    commonWords,
  );

  return {
    beforeRemainingCounts: {
      common: remainingAnswers.common.length,
      other: remainingAnswers.other.length,
    },
    play,
  };
}

async function messageListener(event: MessageEvent) {
  if (event.data.action === 'listen-to-port') {
    const port = event.data.port as MessagePort;
    port.addEventListener('message', messageListener);
    port.start();
    return;
  }
  if (event.data.action === 'add-thread-port') {
    const port = event.data.port as MessagePort;
    threadPorts.push(port);
    port.start();
    return;
  }
  if (event.data.action === 'get-remaining-averages') {
    const remainingAnswers = event.data.remainingAnswers;
    const guesses = event.data.guesses;
    const returnPort = event.data.returnPort as MessagePort;

    try {
      const result = getRemainingAverages(remainingAnswers, guesses, () => {
        returnPort.postMessage('progress');
      });
      returnPort.postMessage({
        action: 'done',
        result,
      });
    } catch (err: any) {
      returnPort.postMessage({
        action: 'error',
        message: err.message,
      });
    } finally {
      returnPort.close();
    }
    return;
  }
  if (event.data.action === 'analyze-guess') {
    const guess = event.data.guess;
    const answer = event.data.answer;
    const previousClues = event.data.previousClues;
    const remainingAnswers = event.data.remainingAnswers;
    const returnPort = event.data.returnPort as MessagePort;

    try {
      const result = await analyzeGuess(
        guess,
        answer,
        previousClues,
        remainingAnswers,
        (done, expecting) => {
          returnPort.postMessage({
            action: 'progress',
            done,
            expecting,
          });
        },
      );
      returnPort.postMessage({
        action: 'done',
        result,
      });
    } catch (err: any) {
      returnPort.postMessage({
        action: 'error',
        message: err.message,
      });
    } finally {
      returnPort.close();
    }
    return;
  }
  if (event.data.action === 'ai-play') {
    const answer = event.data.answer;
    const previousClues = event.data.previousClues;
    const remainingAnswers = event.data.remainingAnswers;
    const returnPort = event.data.returnPort as MessagePort;

    try {
      const result = await getAiPlay(
        answer,
        previousClues,
        remainingAnswers,
        (done, expecting) => {
          returnPort.postMessage({
            action: 'progress',
            done,
            expecting,
          });
        },
      );
      returnPort.postMessage({
        action: 'done',
        result,
      });
    } catch (err: any) {
      returnPort.postMessage({
        action: 'error',
        message: err.message,
      });
    } finally {
      returnPort.close();
    }
    return;
  }
}

addEventListener('message', messageListener);
