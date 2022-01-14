import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const allWords = (require('./answers.json') as string[]).slice(0, 400);
const answers = (require('./answers.json') as string[]).slice(0, 400);

const eliminatedCounts = new Map<string, number[]>(
  allWords.map((word) => [word, []]),
);

for (const answer of answers) {
  const answerLetters = new Set(answer);

  for (const guess of allWords) {
    const remainingAnswers = new Set(answers);
    const remainingAnswerLetters = new Set(answer);

    for (const [i, letter] of [...guess].entries()) {
      // If there's an exact positional match,
      // This is a green square in Wordle.
      if (answer[i] === letter) {
        remainingAnswerLetters.delete(letter);
        for (const remainingAnswer of remainingAnswers) {
          // We can eliminate answers that don't share this exact positional match.
          if (remainingAnswer[i] !== letter) {
            remainingAnswers.delete(remainingAnswer);
          }
        }
      }
      // Otherwise, if the answer contains the letter (and it hasn't already been matched).
      // This is a yellow square in Wordle.
      else if (remainingAnswerLetters.has(letter)) {
        remainingAnswerLetters.delete(letter);

        for (const remainingAnswer of remainingAnswers) {
          // We can eliminate answers that have an exact positional match (since this would be a green square in that case),
          // or answers that don't include the letter.
          if (
            remainingAnswer[i] === letter ||
            !remainingAnswer.includes(letter)
          ) {
            remainingAnswers.delete(remainingAnswer);
          }
        }
      }
      // The letter isn't in the answer.
      // We don't check remainingAnswerLetters here, we only care if the answer doesn't contain the letters at all.
      // This is when a keyboard key is greyed out in Wordle.
      else if (!answerLetters.has(letter)) {
        for (const remainingAnswer of remainingAnswers) {
          // We can eliminate any answer which includes the letter.
          if (remainingAnswer.includes(letter)) {
            remainingAnswers.delete(remainingAnswer);
          }
        }
      }

      // Record how many answers we eliminated for this guess.
      eliminatedCounts.get(guess)!.push(answers.length - remainingAnswers.size);
    }
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
