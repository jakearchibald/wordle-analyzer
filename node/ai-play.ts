import { createRequire } from 'module';
import { generateRules, possibleAnswer, getBestAnswers } from './utils.js';

const require = createRequire(import.meta.url);
const allWords = require('./all-words.json') as string[];
const answers = require('./answers.json') as string[];
const initialBestPlays = require('./eliminated-counts.json') as [
  string,
  number,
][];

const actualAnswer = 'proxy';
let firstGuess = true;
let possibleAnswers = answers;

while (true) {
  const bestPlays = firstGuess
    ? initialBestPlays
    : getBestAnswers(possibleAnswers, allWords).sort((a, b) => b[1] - a[1]);

  const guess = bestPlays[0][0];

  firstGuess = false;

  const remainingAnswers = possibleAnswers.length;

  console.log(
    'The best average play is',
    JSON.stringify(guess),
    'which eliminates, on average,',
    bestPlays[0][1].toFixed(2),
    'of the possible',
    remainingAnswers,
    'answers.',
  );

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

  if (nextAnswers.length === 1) {
    break;
  }

  possibleAnswers = nextAnswers;
  console.log('\nNext turn!\n');
}
