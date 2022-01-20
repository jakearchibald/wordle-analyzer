import { parentPort, workerData, isMainThread } from 'worker_threads';

export type EliminationEntry = [word: string, averageEliminations: number];
export type EliminationAverages = EliminationEntry[];
type FiveLetters = [string, string, string, string, string];

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
export function possibleAnswer(
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
 * Generate the clues given by a particular guess.
 */
export function generateRules(
  answer: string,
  guess: string,
): readonly [
  positionalMatches: FiveLetters,
  positionalNotMatches: FiveLetters,
  additionalRequiredLetters: string[],
  remainingMustNotContain: Set<string>,
] {
  const remainingAnswerLetters = [...answer];
  const positionalMatches: FiveLetters = ['', '', '', '', ''];
  const positionalNotMatches: FiveLetters = ['', '', '', '', ''];
  const additionalKnownLetters: string[] = [];
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
      additionalKnownLetters.push(letter);
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

  return [
    positionalMatches,
    positionalNotMatches,
    additionalKnownLetters,
    remainingMustNotContain,
  ] as const;
}

/**
 * Figure out the average number of eliminations for a particular guess.
 *
 * @param answers Array of answers Wordle may select
 * @param guesses Array of guesses Wordle will accept
 */
export function getEliminationAverages(
  answers: string[],
  guesses: string[],
): EliminationAverages {
  const eliminationCounts = guesses.map((guess) => [guess, []]) as [
    string,
    number[],
  ][];

  for (const answer of answers) {
    for (const [i, guess] of guesses.entries()) {
      const [
        positionalMatches,
        positionalNotMatches,
        additionalKnownLetters,
        remainingMustNotContain,
      ] = generateRules(answer, guess);

      let validAnswers = 0;

      for (const answer of answers) {
        if (
          possibleAnswer(
            answer,
            positionalMatches,
            positionalNotMatches,
            additionalKnownLetters,
            remainingMustNotContain,
          )
        ) {
          validAnswers++;
        }
      }

      eliminationCounts[i][1].push(answers.length - validAnswers);
    }

    if (parentPort) parentPort.postMessage('answer-done');
  }

  return eliminationCounts.map(([guess, counts]) => [
    guess,
    counts.reduce((a, b) => a + b, 0) / counts.length,
  ]);
}

export function getBestPlay(
  remainingAnswers: string[],
  eliminationCounts: EliminationAverages,
): EliminationEntry {
  if (remainingAnswers.length > 100) return eliminationCounts[0];

  const threshold = 1.1;
  const bestAvgElimination = eliminationCounts[0][1];
  let first = true;

  for (const eliminationEntry of eliminationCounts) {
    if (first) {
      first = false;
      continue;
    }

    if (bestAvgElimination - eliminationEntry[1] > threshold) {
      return eliminationCounts[0];
    }

    if (remainingAnswers.includes(eliminationEntry[0])) {
      return eliminationEntry;
    }
  }

  return eliminationCounts[0];
}

if (!isMainThread) {
  const result = getEliminationAverages(workerData.answers, workerData.guesses);
  parentPort!.postMessage(result);
}
