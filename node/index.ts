import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const allWords = (require('./answers.json') as string[]).slice(0, 400);
const answers = (require('./answers.json') as string[]).slice(0, 400);

function possibleAnswer(
  answer: string,
  positionalMatches: string[],
  positionalNotMatches: string[],
  additionalRequiredLetters: string[],
  mustNotContain: Set<string>,
): boolean {
  const additionalRequiredLettersCopy = additionalRequiredLetters.slice();

  for (let i = 0; i < answer.length; i++) {
    const letter = answer[i];

    if (positionalMatches[i]) {
      if (positionalMatches[i] !== letter) return false;
      // If we have an exact positional match, this letter is valid and no further checks are needed.
      continue;
    }

    if (
      (positionalNotMatches[i] && letter === positionalNotMatches[i]) ||
      mustNotContain.has(letter)
    ) {
      return false;
    }

    const index = additionalRequiredLettersCopy.indexOf(letter);
    if (index !== -1) additionalRequiredLettersCopy.splice(index, 1);
  }

  // It's valid if we've used up all the letters we need to
  return additionalRequiredLettersCopy.length === 0;
}

function getBestAnswers() {
  const eliminatedCounts = new Map<string, number[]>(
    allWords.map((word) => [word, []]),
  );

  for (const answer of answers) {
    const answerLetters = new Set(answer);

    for (const guess of allWords) {
      const remainingAnswerLetters = new Set(answer);
      const positionalMatches = ['', '', '', '', ''];
      const positionalNotMatches = ['', '', '', '', ''];
      const additionalRequiredLetters: string[] = [];
      const mustNotContain = new Set<string>();

      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];

        // If there's an exact positional match,
        // This is a green square in Wordle.
        if (answer[i] === letter) {
          remainingAnswerLetters.delete(letter);
          // Valid answers must also have this positional match
          positionalMatches[i] = letter;
        }
        // Otherwise, if the answer contains the letter (and it hasn't already been matched).
        // This is a yellow square in Wordle.
        else if (remainingAnswerLetters.has(letter)) {
          remainingAnswerLetters.delete(letter);
          // Valid answers must not have this positional match, otherwise it'd be a green square
          positionalNotMatches[i] = letter;
          // Valid answers must contain this letter
          additionalRequiredLetters.push(letter);
        }
        // The letter isn't in the answer.
        // We don't check remainingAnswerLetters here, we only care if the answer doesn't contain the letters at all.
        // This is when a keyboard key is greyed out in Wordle.
        else if (!answerLetters.has(letter)) {
          mustNotContain.add(letter);
        }
      }

      let validAnswers = 0;

      for (const answer of answers) {
        if (
          possibleAnswer(
            answer,
            positionalMatches,
            positionalNotMatches,
            additionalRequiredLetters,
            mustNotContain,
          )
        ) {
          validAnswers++;
        }
      }

      // Record how many answers we eliminated for this guess.
      eliminatedCounts.get(guess)!.push(answers.length - validAnswers);
    }
  }

  const averageEliminatedCounts: [string, number][] = [];

  for (const [guess, eliminated] of eliminatedCounts) {
    averageEliminatedCounts.push([
      guess,
      eliminated.reduce((a, b) => a + b, 0) / eliminated.length,
    ]);
  }

  averageEliminatedCounts.sort((a, b) => b[1] - a[1]);
  console.log(averageEliminatedCounts.slice(0, 10));
}

getBestAnswers();
