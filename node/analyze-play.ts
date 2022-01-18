import { createRequire } from 'module';
import {
  generateRules,
  possibleAnswer,
  getEliminationAverages,
  getBestPlay,
} from './utils.js';

const require = createRequire(import.meta.url);
const allWords = require('./all-words.json') as string[];
const answers = require('./answers.json') as string[];
const initialBestPlays = require('./eliminated-counts.json') as [
  string,
  number,
][];

const guesses = ['soare', 'pleat', 'baked', 'abbey'];
const actualAnswer = guesses.slice(-1)[0];
let firstGuess = true;
let possibleAnswers = answers;

for (const guess of guesses) {
  if (guess === actualAnswer) {
    console.log(`You found the answer!`, JSON.stringify(actualAnswer));
    break;
  }

  const bestPlays = firstGuess
    ? initialBestPlays
    : getEliminationAverages(possibleAnswers, allWords).sort(
        (a, b) => b[1] - a[1],
      );

  const bestPlay = getBestPlay(possibleAnswers, bestPlays);
  const remainingAnswers = possibleAnswers.length;

  firstGuess = false;

  console.log(
    'The best average play is',
    JSON.stringify(bestPlay[0]),
    'which eliminates, on average,',
    bestPlay[1].toFixed(2),
    'of the possible',
    remainingAnswers,
    'answers.',
  );

  if (guess === bestPlay[0]) {
    console.log(`That's what you went for!`);
  } else {
    const playStats = bestPlays.find(([play]) => play === guess);
    console.log(
      'You played',
      JSON.stringify(guess),
      'which eliminates, on average,',
      playStats![1].toFixed(2),
      'of the possible',
      remainingAnswers,
      'answers.',
    );
  }

  const [
    positionalMatches,
    positionalNotMatches,
    additionalKnownLetters,
    remainingMustNotContain,
  ] = generateRules(actualAnswer, guess);

  const nextAnswers = possibleAnswers.filter((answer) =>
    possibleAnswer(
      answer,
      positionalMatches,
      positionalNotMatches,
      additionalKnownLetters,
      remainingMustNotContain,
    ),
  );

  console.log(
    JSON.stringify(guess),
    'eliminated',
    remainingAnswers - nextAnswers.length,
    'answers. Leaving',
    nextAnswers.length,
  );

  if (nextAnswers.length < 30) {
    console.log(nextAnswers);
  }

  {
    const [
      positionalMatches,
      positionalNotMatches,
      additionalKnownLetters,
      remainingMustNotContain,
    ] = generateRules(actualAnswer, bestPlay[0]);

    const aiNextAnswers = possibleAnswers.filter((answer) =>
      possibleAnswer(
        answer,
        positionalMatches,
        positionalNotMatches,
        additionalKnownLetters,
        remainingMustNotContain,
      ),
    );

    if (guess !== bestPlay[0]) {
      console.log(
        JSON.stringify(bestPlay[0]),
        'would have eliminated',
        remainingAnswers - aiNextAnswers.length,
        'answers. Leaving',
        aiNextAnswers.length,
      );
    }
  }

  possibleAnswers = nextAnswers;
  console.log('\nNext turn!\n');
}
