import { parentPort, workerData, isMainThread } from 'worker_threads';
import { writeFile } from 'fs/promises';
import { URL } from 'url';

import type { GuessEliminations } from './types';

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
  positionalMatches: string[],
  positionalNotMatches: string[],
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

export async function writeEliminations(
  guesses: string[],
  guessesOffset: number,
  answers: string[],
) {
  for (const [guessIndex, guess] of guesses.entries()) {
    debugger;
    const guessEliminations: GuessEliminations = [];

    for (const [answerIndex, answer] of answers.entries()) {
      // TODO: all of this is in the wrong place
      // It needs to go up one level, maybe,
      const remainingAnswerLetters = [...answer];
      const positionalMatches = ['', '', '', '', ''];
      const positionalNotMatches = ['', '', '', '', ''];
      const additionalKnownLetters: string[] = [];
      const remainingMustNotContain = new Set<string>();

      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];

        // If there's an exact positional match,
        // This is a green square in Wordle.
        if (answer[i] === letter) {
          remainingAnswerLetters.splice(
            remainingAnswerLetters.indexOf(letter),
            1,
          );
          // Valid answers must also have this positional match
          positionalMatches[i] = letter;
        }
        // Otherwise, if the answer contains the letter (and it hasn't already been matched).
        // This is a yellow square in Wordle.
        else if (remainingAnswerLetters.includes(letter)) {
          remainingAnswerLetters.splice(
            remainingAnswerLetters.indexOf(letter),
            1,
          );
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

      const eliminations: number[] = [];
      guessEliminations[answerIndex] = eliminations;
      for (const [answerIndex, answer] of answers.entries()) {
        if (
          !possibleAnswer(
            answer,
            positionalMatches,
            positionalNotMatches,
            additionalKnownLetters,
            remainingMustNotContain,
          )
        ) {
          eliminations.push(answerIndex);
        }
      }
    }

    await writeFile(
      new URL(`./data/${guessIndex + guessesOffset}.json`, import.meta.url),
      JSON.stringify(guessEliminations),
    );
    if (parentPort) parentPort.postMessage('part-done');
  }
}

if (!isMainThread) {
  writeEliminations(
    workerData.guesses,
    workerData.guessesOffset,
    workerData.answers,
  ).then(() => {
    parentPort!.postMessage('done!');
  });
}