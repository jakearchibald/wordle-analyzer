import dataUrl from 'url:./word-data.json';
import remainingAveragesUrl from 'url:./initial-remaining-averages.json';
import {
  GuessAnalysis,
  FiveLetters,
  Clue,
  RemainingAveragesResult,
  RemainingAnswers,
  CellColors,
  PlayAnalysis,
  AIPlay,
  AIStrategy,
  RemainingCountsResult,
  Luck,
} from 'shared-types/index';

type WordDataType = typeof import('./word-data.json');
let wordData: Promise<WordDataType> | undefined;
const getWordData = (): Promise<WordDataType> =>
  wordData || (wordData = fetch(dataUrl).then((res) => res.json()));

let allWords: Promise<string[]> | undefined;
const getAllWords = () =>
  allWords ||
  (allWords = getWordData().then((data) => [...data.common, ...data.other]));

let initialRemainingAverages: Promise<RemainingAveragesResult> | undefined;
const getInitialRemainingAverages = (): Promise<RemainingAveragesResult> =>
  initialRemainingAverages ||
  (initialRemainingAverages = fetch(remainingAveragesUrl).then((res) =>
    res.json(),
  ));

let commonWordSet: Promise<Set<string>> | undefined;
const getCommonWordSet = () =>
  commonWordSet ||
  (commonWordSet = getWordData().then((data) => new Set(data.common)));

let allWordsSet: Promise<Set<string>> | undefined;
const getAllWordsSet = () =>
  allWordsSet || (allWordsSet = getAllWords().then((words) => new Set(words)));

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

function generateBlockColors({
  positionalMatches,
  positionalNotMatches,
}: Clue): string {
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
 * @param guess The answer to check
 * @param positionalMatches Array like ['', 'b', 'b', '', ''] representing known letters + position. Empty string means unknown.
 * @param positionalNotMatches Array like ['c', 'a', '', '', 's'] representing letters + position that are known to be incorrect. Empty string means unknown.
 * @param additionalRequiredLetters Array of letters that are known to be in one of the spaces that isn't covered by positionalMatches.
 * @param remainingMustNotContain Set of letters that must not appear in the answer once other rules have been processed.
 * @returns
 */
function possibleAnswer(
  guess: string,
  {
    additionalRequiredLetters,
    positionalMatches,
    positionalNotMatches,
    remainingMustNotContain,
  }: Clue,
): boolean {
  const additionalRequiredLettersCopy = additionalRequiredLetters.slice();

  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i];

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

interface FlattenedClue {
  positionalMatches: FiveLetters;
  positionalNotMatches: [
    Set<string>,
    Set<string>,
    Set<string>,
    Set<string>,
    Set<string>,
  ];
  requiredLetters: string;
  remainingMustNotContain: Set<string>;
}

function flattenClues(clues: Clue[]): FlattenedClue {
  let requiredLetters = '';
  const positionalMatches: FiveLetters = ['', '', '', '', ''];
  const remainingMustNotContain = new Set<string>();
  const positionalNotMatches = positionalMatches.map(
    () => new Set<string>(),
  ) as [Set<string>, Set<string>, Set<string>, Set<string>, Set<string>];

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
    // Add must-not-contain letters
    for (const letter of clue.remainingMustNotContain) {
      remainingMustNotContain.add(letter);
    }

    // Process not-matches
    for (const [i, notMatch] of clue.positionalNotMatches.entries()) {
      positionalNotMatches[i].add(notMatch);
    }
  }

  return {
    requiredLetters,
    positionalMatches,
    positionalNotMatches,
    remainingMustNotContain,
  };
}

// Hard mode in wordle means:
// Green letters must be played in their correct position
// Yellow letters must be used in the remaining squares
function validHardModeGuess(
  guess: string,
  flattenedClues: FlattenedClue,
): boolean {
  let requiredLettersRemaining = flattenedClues.requiredLetters;

  for (const [i, letter] of [...guess].entries()) {
    if (
      flattenedClues.positionalMatches[i] &&
      flattenedClues.positionalMatches[i] !== letter
    ) {
      return false;
    }

    requiredLettersRemaining = requiredLettersRemaining.replace(letter, '');
  }

  return requiredLettersRemaining.length === 0;
}

const numberWithOrdinal = ['1st', '2nd', '3rd', '4th', '5th'];

interface ClueViolations {
  missingPositionalMatches: string[];
  violatedPositionalNotMatches: string[];
  missingAdditionalRequiredLetters: string[];
  violatedMustNotContain: string[];
}

function getClueViolations(
  guess: string,
  flattenedClues: FlattenedClue,
): ClueViolations {
  const missingPositionalMatches = new Set<string>();
  const violatedPositionalNotMatches = new Set<string>();
  const missingAdditionalRequiredLetters = new Set<string>();
  const violatedMustNotContain = new Set<string>();

  for (const [i, notMatch] of flattenedClues.positionalNotMatches.entries()) {
    if (notMatch.has(guess[i])) {
      violatedPositionalNotMatches.add(
        `${numberWithOrdinal[i]} letter must not be "${guess[
          i
        ].toUpperCase()}"`,
      );
    }
  }

  // Check required letters:
  let requiredLettersRemaining = flattenedClues.requiredLetters;

  for (const letter of guess) {
    const len = requiredLettersRemaining.length;
    requiredLettersRemaining = requiredLettersRemaining.replace(letter, '');
    // remainingMustNotContain is only checked if the letter is not found in positionalMatches or additionalRequiredLetters.
    // This allows a letter to appear in positionalMatches and/or additionalRequiredLetters, and remainingMustNotContain.
    // Eg, if additionalRequiredLetters contains 's' and remainingMustNotContain contains 's', this ensures the answer must contain one 's'.
    if (
      len === requiredLettersRemaining.length &&
      flattenedClues.remainingMustNotContain.has(letter)
    ) {
      violatedMustNotContain.add(`Too many "${letter.toUpperCase()}"s`);
    }
  }

  for (const letter of requiredLettersRemaining) {
    const positionalIndex = flattenedClues.positionalMatches.indexOf(letter);
    if (positionalIndex !== -1) {
      missingPositionalMatches.add(
        `${
          numberWithOrdinal[positionalIndex]
        } letter must be "${letter.toUpperCase()}"`,
      );
      flattenedClues.positionalMatches[positionalIndex] = '';
    } else {
      missingAdditionalRequiredLetters.add(
        `Too few "${letter.toUpperCase()}"s`,
      );
    }
  }

  return {
    missingPositionalMatches: [...missingPositionalMatches],
    violatedPositionalNotMatches: [...violatedPositionalNotMatches],
    missingAdditionalRequiredLetters: [...missingAdditionalRequiredLetters],
    violatedMustNotContain: [...violatedMustNotContain],
  };
}

interface RemainingCountOptions {
  onAnswerDone?: () => void;
}

/**
 * Figure out the number of possibilities remaining for particular guesses.
 */
function getRemainingCounts(
  remainingAnswers: RemainingAnswers,
  guesses: string[],
  { onAnswerDone }: RemainingCountOptions = {},
): RemainingCountsResult {
  const counts: RemainingCountsResult = {
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
      if (guess === answer) {
        counts.common[i][1].push(0);
        counts.all[i][1].push(0);
        continue;
      }

      const clue = generateClue(answer, guess);
      const key = generateBlockColors(clue);

      if (remainingCache[key]) {
        counts.common[i][1].push(remainingCache[key]![0]);
        counts.all[i][1].push(remainingCache[key]![1]);
        continue;
      }

      let validAnswers = 0;
      let validCommonAnswers = 0;

      for (const [answerIndex, answer] of allAnswers.entries()) {
        if (possibleAnswer(answer, clue)) {
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

  return counts;
}

/**
 * Figure out the average number of possibilities remaining for a particular guess.
 */
function getRemainingAverages(
  remainingAnswers: RemainingAnswers,
  guesses: string[],
  options: RemainingCountOptions = {},
): RemainingAveragesResult {
  const counts = getRemainingCounts(remainingAnswers, guesses, options);

  // Convert the list of counts to averages
  return Object.fromEntries(
    Object.entries(counts).map(([key, counts]) => [
      key,
      counts.map(([guess, counts]) => [
        guess,
        counts.reduce((a, b) => a + b, 0) / counts.length,
      ]),
    ]),
  ) as RemainingAveragesResult;
}

interface GetRemainingAveragesOptions {
  hardModeRequirements?: FlattenedClue;
  onProgress?: (done: number, expecting: number) => void;
}

/** Multithreaded version of getRemainingAverages */
async function getRemainingAveragesMT(
  remainingAnswers: RemainingAnswers,
  { hardModeRequirements, onProgress }: GetRemainingAveragesOptions = {},
): Promise<RemainingAveragesResult> {
  if (threadPorts.length === 0) {
    throw Error('No worker threads available');
  }

  if (
    remainingAnswers.common.length === 0 &&
    remainingAnswers.other.length === 0
  ) {
    throw Error('No remaining answers');
  }

  const guesses = await getAllWords();
  const validGuesses = hardModeRequirements
    ? guesses.filter((guess) => validHardModeGuess(guess, hardModeRequirements))
    : guesses;

  let done = 0;
  const expecting = validGuesses.length;

  const groupSize = Math.ceil(validGuesses.length / threadPorts.length);
  const guessesGroups = Array.from({ length: threadPorts.length }, (_, i) =>
    validGuesses.slice(i * groupSize, (i + 1) * groupSize),
  );

  const resultSets = await Promise.all(
    guessesGroups.map(
      (guessesGroup, i) =>
        new Promise<RemainingAveragesResult>((resolve, reject) => {
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
                onProgress?.(done, expecting);
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
  ) as RemainingAveragesResult;
}

export function getBestPlay(
  remainingAnswers: RemainingAnswers,
  remainingResult: RemainingAveragesResult,
): { guess: string; strategy: AIStrategy } {
  // Focus on the common words first.
  for (let [isCommon, remaining, bestGuesses] of [
    [true, remainingAnswers.common, remainingResult.common] as const,
    [false, remainingAnswers.other, remainingResult.all] as const,
  ]) {
    // Ran out of common answers.
    if (remaining.length === 0) continue;
    // If we're down to one option, play it.
    if (remaining.length === 1) {
      return {
        guess: remaining[0],
        strategy: isCommon
          ? AIStrategy.PlaySingleCommon
          : AIStrategy.PlaySingleUncommon,
      };
    }

    // If we're down to two options, then always focus on eliminating from the 'all' list,
    // preparing for the case where this isn't a common word.
    if (remaining.length === 2) bestGuesses = remainingResult.all;

    const bestGuess = bestGuesses[0];

    // Try to find a guess that's still a remaining answer.
    for (const guess of bestGuesses) {
      // If the remaining answers don't eliminate enough, just go with the best guess.
      // If there are only two remaining, always wait for one of those to come along.
      if (guess[1] - bestGuess[1] > 0.5 && remaining.length !== 2) {
        return {
          guess: bestGuess[0],
          strategy: isCommon
            ? AIStrategy.EliminateCommon
            : AIStrategy.EliminateUncommon,
        };
      }
      // Otherwise, go with a guess that's also a remaining answer.
      if (remaining.includes(guess[0])) {
        return {
          guess: guess[0],
          strategy: isCommon
            ? remaining.length === 2
              ? AIStrategy.Play5050Common
              : AIStrategy.EliminateCommonWithAnswer
            : // Otherwise, is uncommon:
            remaining.length === 2
            ? AIStrategy.Play5050Uncommon
            : AIStrategy.EliminateUncommonWithAnswer,
        };
      }
    }
  }

  throw Error('No remaining answers');
}

function calculateLuck(
  guess: string,
  beforeRemainingAnswers: RemainingAnswers,
  afterRemainingAnswers: RemainingAnswers,
  commonWordSet: Set<string>,
): Luck {
  const win =
    afterRemainingAnswers.common.length === 0 &&
    afterRemainingAnswers.other.length === 0;

  // Base luck rating on common words if:
  // If it's a common-word win
  // Or if there are common words left over after the guess
  const useCommonLists =
    (win && commonWordSet.has(guess)) ||
    afterRemainingAnswers.common.length !== 0;

  const [remainingResult, numNewRemaining] = useCommonLists
    ? [
        getRemainingCounts({ ...beforeRemainingAnswers, other: [] }, [guess]),
        afterRemainingAnswers.common.length,
      ]
    : [
        getRemainingCounts(beforeRemainingAnswers, [guess]),
        afterRemainingAnswers.common.length +
          afterRemainingAnswers.other.length,
      ];

  const remainingCounts = remainingResult.all[0][1].sort((a, b) => b - a);

  let worseCount = remainingCounts.findIndex(
    (remaining) => numNewRemaining >= remaining,
  );

  if (worseCount === -1) worseCount = remainingCounts.length;

  let equalCount = 0;

  for (let i = worseCount; i < remainingCounts.length; i++) {
    if (remainingCounts[i] !== numNewRemaining) break;
    equalCount++;
  }

  const betterCount = remainingCounts.length - worseCount - equalCount;

  return betterCount > worseCount
    ? {
        good: false,
        chance: (equalCount + worseCount) / remainingCounts.length,
      }
    : {
        good: true,
        chance: (betterCount + equalCount) / remainingCounts.length,
      };
}

function calculateGuessQuality(
  afterRemainingAnswers: RemainingAnswers,
  guessAverages: RemainingAveragesResult,
  commonIndex: number,
  allIndex: number,
): number {
  const [guessQualityList, guessQualityIndex] =
    afterRemainingAnswers.common.length !== 0
      ? [guessAverages.common, commonIndex]
      : [guessAverages.all, allIndex];

  let uniqueRemaining = 0;
  let lastRemaining = -1;
  let guessUniqueIndex = -1;
  const guessAverageRemaining = guessQualityList[guessQualityIndex][1];

  for (const [_, averageRemaining] of guessQualityList) {
    if (lastRemaining !== averageRemaining) {
      if (guessAverageRemaining === averageRemaining) {
        guessUniqueIndex = uniqueRemaining;
      }
      uniqueRemaining++;
      lastRemaining = averageRemaining;
    }
  }

  return 1 - guessUniqueIndex / uniqueRemaining;
}

function getPlayAnalysis(
  guess: string,
  answer: string,
  flattenedClues: FlattenedClue,
  beforeRemainingAnswers: RemainingAnswers,
  remainingAverages: RemainingAveragesResult,
  commonWords: Set<string>,
  { hardMode = false }: { hardMode?: boolean } = {},
): PlayAnalysis {
  const clue = generateClue(answer, guess);

  const afterRemainingAnswers =
    guess === answer
      ? { common: [], other: [] }
      : (Object.fromEntries(
          Object.entries(beforeRemainingAnswers).map(([key, answers]) => [
            key,
            answers.filter((word) => possibleAnswer(word, clue)),
          ]),
        ) as RemainingAnswers);

  const commonRemainingResultIndex = remainingAverages.common.findIndex(
    (item) => item[0] === guess,
  );
  const allRemainingResultIndex = remainingAverages.all.findIndex(
    (item) => item[0] === guess,
  );

  const clueViolations = getClueViolations(guess, flattenedClues);
  const hardModeViolations = [
    ...clueViolations.missingPositionalMatches,
    ...clueViolations.missingAdditionalRequiredLetters,
  ];
  const cheat = hardMode && hardModeViolations.length > 0;

  const commonRemainingResult =
    remainingAverages.common[commonRemainingResultIndex];
  const allRemainingResult = remainingAverages.all[allRemainingResultIndex];

  return {
    guess,
    clue,
    colors: generateBlockColors(clue).split('') as CellColors,
    hardModeViolations,
    unusedClues: [
      ...clueViolations.missingPositionalMatches,
      ...clueViolations.violatedPositionalNotMatches,
      ...clueViolations.missingAdditionalRequiredLetters,
      ...clueViolations.violatedMustNotContain,
    ],
    remainingAnswers: afterRemainingAnswers,
    averageRemaining:
      commonRemainingResult && allRemainingResult
        ? {
            common: commonRemainingResult[1],
            all: allRemainingResult[1],
          }
        : undefined,
    commonWord: commonWords.has(guess),
    luck: cheat
      ? undefined
      : calculateLuck(
          guess,
          beforeRemainingAnswers,
          afterRemainingAnswers,
          commonWords,
        ),
    guessQuality: cheat
      ? undefined
      : calculateGuessQuality(
          afterRemainingAnswers,
          remainingAverages,
          commonRemainingResultIndex,
          allRemainingResultIndex,
        ),
  };
}

function bestPerformingPlay(
  answer: string,
  plays: readonly [PlayAnalysis, PlayAnalysis],
): PlayAnalysis | undefined {
  if (plays.every((p) => p.guess === answer)) return undefined;

  const correctGuessingPlay = plays.find((p) => p.guess === answer);
  if (correctGuessingPlay) return correctGuessingPlay;

  // The best is the one that eliminates the most common words,
  // with other words as a tie-breaker.
  for (const type of ['common', 'other'] as const) {
    if (
      plays[0].remainingAnswers[type].length !==
      plays[1].remainingAnswers[type].length
    ) {
      return plays[0].remainingAnswers[type].length <
        plays[1].remainingAnswers[type].length
        ? plays[0]
        : plays[1];
    }
  }

  return undefined;
}

interface AnalyzeGuessOptions {
  hardMode?: boolean;
  remainingAnswers?: RemainingAnswers;
  onProgress?: (done: number, expecting: number) => void;
}

async function analyzeGuess(
  guess: string,
  answer: string,
  previousClues: Clue[],
  { hardMode = false, remainingAnswers, onProgress }: AnalyzeGuessOptions = {},
): Promise<GuessAnalysis> {
  let remainingAverages: RemainingAveragesResult | undefined;

  const flattenedClues = flattenClues(previousClues);

  if (!remainingAnswers) {
    [remainingAnswers, remainingAverages] = await Promise.all([
      getWordData(),
      getInitialRemainingAverages(),
    ]);
  }

  if (!remainingAverages) {
    remainingAverages = await getRemainingAveragesMT(remainingAnswers, {
      hardModeRequirements: hardMode ? flattenedClues : undefined,
      onProgress,
    });
  }

  const commonWords = await getCommonWordSet();
  const aiBestPlay = getBestPlay(remainingAnswers, remainingAverages);

  const userPlay = getPlayAnalysis(
    guess,
    answer,
    flattenedClues,
    remainingAnswers,
    remainingAverages,
    commonWords,
    { hardMode },
  );
  const aiPlay =
    aiBestPlay.guess === guess
      ? userPlay
      : getPlayAnalysis(
          aiBestPlay.guess,
          answer,
          flattenedClues,
          remainingAnswers,
          remainingAverages,
          commonWords,
          { hardMode },
        );

  return {
    beforeRemainingCounts: {
      common: remainingAnswers.common.length,
      other: remainingAnswers.other.length,
    },
    plays: {
      user: userPlay,
      ai: aiPlay,
      aiStrategy: aiBestPlay.strategy,
      bestPlay: bestPerformingPlay(answer, [userPlay, aiPlay]),
    },
  };
}

async function getAiPlay(
  answer: string,
  previousClues: Clue[],
  { hardMode = false, remainingAnswers, onProgress }: AnalyzeGuessOptions = {},
): Promise<AIPlay> {
  const flattenedClues = flattenClues(previousClues);

  let remainingAverages: RemainingAveragesResult | undefined;

  if (!remainingAnswers) {
    [remainingAnswers, remainingAverages] = await Promise.all([
      getWordData(),
      getInitialRemainingAverages(),
    ]);
  }

  if (!remainingAverages) {
    remainingAverages = await getRemainingAveragesMT(remainingAnswers, {
      hardModeRequirements: hardMode ? flattenedClues : undefined,
      onProgress,
    });
  }

  const commonWords = await getCommonWordSet();
  const bestPlay = getBestPlay(remainingAnswers, remainingAverages);
  const play = await getPlayAnalysis(
    bestPlay.guess,
    answer,
    flattenedClues,
    remainingAnswers,
    remainingAverages,
    commonWords,
    { hardMode },
  );

  return {
    beforeRemainingCounts: {
      common: remainingAnswers.common.length,
      other: remainingAnswers.other.length,
    },
    play,
    strategy: bestPlay.strategy,
  };
}

function getPlayColors(answer: string, guesses: string[]): CellColors[] {
  return guesses.map((guess) => {
    const clue = generateClue(answer, guess);
    return generateBlockColors(clue).split('') as CellColors;
  });
}

async function getInvalidWords(words: string[]): Promise<string[]> {
  const allWordsSet = await getAllWordsSet();
  return words.filter((word) => !allWordsSet.has(word));
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
    const remainingAnswers = event.data.remainingAnswers as RemainingAnswers;
    const guesses = event.data.guesses as string[];
    const returnPort = event.data.returnPort as MessagePort;

    try {
      const result = getRemainingAverages(remainingAnswers, guesses, {
        onAnswerDone: () => {
          returnPort.postMessage('progress');
        },
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
    const guess = event.data.guess as string;
    const answer = event.data.answer as string;
    const previousClues = event.data.previousClues as Clue[];
    const remainingAnswers = event.data.remainingAnswers as RemainingAnswers;
    const hardMode = event.data.hardMode as boolean;
    const returnPort = event.data.returnPort as MessagePort;

    try {
      const result = await analyzeGuess(guess, answer, previousClues, {
        hardMode,
        remainingAnswers,
        onProgress: (done, expecting) => {
          returnPort.postMessage({
            action: 'progress',
            done,
            expecting,
          });
        },
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
  if (event.data.action === 'ai-play') {
    const answer = event.data.answer as string;
    const previousClues = event.data.previousClues as Clue[];
    const remainingAnswers = event.data.remainingAnswers as RemainingAnswers;
    const hardMode = event.data.hardMode as boolean;
    const returnPort = event.data.returnPort as MessagePort;

    try {
      const result = await getAiPlay(answer, previousClues, {
        hardMode,
        remainingAnswers,
        onProgress: (done, expecting) => {
          returnPort.postMessage({
            action: 'progress',
            done,
            expecting,
          });
        },
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
  if (event.data.action === 'guesses-colors') {
    const answer = event.data.answer as string;
    const guesses = event.data.guesses as string[];
    const returnPort = event.data.returnPort as MessagePort;

    try {
      const result = getPlayColors(answer, guesses);
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
  if (event.data.action === 'invalid-words') {
    const words = event.data.words as string[];
    const returnPort = event.data.returnPort as MessagePort;

    try {
      const result = await getInvalidWords(words);
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
