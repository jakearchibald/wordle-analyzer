import { createRequire } from 'module';
import { getRemainingAveragesMT } from './get-remaining-averages-mt.js';
import { generateRules, possibleAnswer, getBestPlay } from './utils.js';

const require = createRequire(import.meta.url);
const wordData =
  require('./word-data.json') as typeof import('./word-data.json');
const initialLeastRemaining = require('./remaining-counts.json') as {
  common: [string, number][];
  other: [string, number][];
};
const allWords = [...wordData.common, ...wordData.other];

const actualAnswer = 'light';
const forceFirstGuess = '';
let firstGuess = true;
let commonPossibleAnswers = wordData.common;
let otherPossibleAnswers = wordData.other;

while (true) {
  const leastRemainingPlays = firstGuess
    ? initialLeastRemaining
    : await getRemainingAveragesMT(
        commonPossibleAnswers,
        otherPossibleAnswers,
        allWords,
      );

  const guess = getBestPlay(
    commonPossibleAnswers,
    otherPossibleAnswers,
    leastRemainingPlays.common,
    leastRemainingPlays.other,
  );

  firstGuess = false;

  console.log(
    'The AI is playing',
    JSON.stringify(guess),
    'which leaves, on average,',
    leastRemainingPlays.common.find((n) => n[0] === guess)![1].toFixed(2),
    'common remaining answers, of the total',
    commonPossibleAnswers.length,
    'and',
    leastRemainingPlays.other.find((n) => n[0] === guess)![1].toFixed(2),
    'overall remaining answers, of the total',
    commonPossibleAnswers.length + otherPossibleAnswers.length,
  );

  if (guess === actualAnswer) {
    console.log(`That's the right answer!`);
    process.exit();
  }

  const [
    positionalMatches,
    positionalNotMatches,
    additionalKnownLetters,
    remainingMustNotContain,
  ] = generateRules(actualAnswer, guess);

  const nextCommonAnswers = commonPossibleAnswers.filter((answer) =>
    possibleAnswer(
      answer,
      positionalMatches,
      positionalNotMatches,
      additionalKnownLetters,
      remainingMustNotContain,
    ),
  );
  const nextOtherAnswers = otherPossibleAnswers.filter((answer) =>
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
    'actually leaves',
    nextCommonAnswers.length,
    'common answers',
    'and',
    nextCommonAnswers.length + nextOtherAnswers.length,
    'total answers',
  );

  if (nextCommonAnswers.length < 30) {
    console.log('common', nextCommonAnswers);
  }
  if (nextOtherAnswers.length < 30) {
    console.log('uncommon', nextOtherAnswers);
  }

  commonPossibleAnswers = nextCommonAnswers;
  otherPossibleAnswers = nextOtherAnswers;

  console.log('\nNext turn!\n');
}
