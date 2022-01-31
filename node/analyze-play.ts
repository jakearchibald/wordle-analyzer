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

const guesses = ['roate', 'dunks', 'blimp', 'light'];
const actualAnswer = guesses.slice(-1)[0];
let firstGuess = true;
let commonPossibleAnswers = wordData.common;
let otherPossibleAnswers = wordData.other;

for (const guess of guesses) {
  if (guess === actualAnswer) {
    console.log(`You found the answer!`, JSON.stringify(actualAnswer));
    console.log(
      commonPossibleAnswers.includes(guess) ? 'It is' : 'it is not',
      'a common word.',
    );
    process.exit();
  }

  const leastRemainingPlays = firstGuess
    ? initialLeastRemaining
    : await getRemainingAveragesMT(
        commonPossibleAnswers,
        otherPossibleAnswers,
        allWords,
      );

  const bestPlay = getBestPlay(
    commonPossibleAnswers,
    otherPossibleAnswers,
    leastRemainingPlays.common,
    leastRemainingPlays.other,
  );

  firstGuess = false;

  console.log(
    'The computer would play',
    JSON.stringify(bestPlay),
    'which leaves, on average,',
    leastRemainingPlays.common.find((n) => n[0] === bestPlay)![1].toFixed(2),
    'common remaining answers, of the total',
    commonPossibleAnswers.length,
    'and',
    leastRemainingPlays.other.find((n) => n[0] === bestPlay)![1].toFixed(2),
    'overall remaining answers, of the total',
    commonPossibleAnswers.length + otherPossibleAnswers.length,
  );

  if (guess === bestPlay) {
    console.log(`That's what you went for!`);
  } else {
    console.log(
      'You played',
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

  {
    const [
      positionalMatches,
      positionalNotMatches,
      additionalKnownLetters,
      remainingMustNotContain,
    ] = generateRules(actualAnswer, bestPlay);

    const aiCommonAnswers = commonPossibleAnswers.filter((answer) =>
      possibleAnswer(
        answer,
        positionalMatches,
        positionalNotMatches,
        additionalKnownLetters,
        remainingMustNotContain,
      ),
    );
    const aiOtherAnswers = otherPossibleAnswers.filter((answer) =>
      possibleAnswer(
        answer,
        positionalMatches,
        positionalNotMatches,
        additionalKnownLetters,
        remainingMustNotContain,
      ),
    );

    console.log(
      JSON.stringify(bestPlay),
      'would have left',
      aiCommonAnswers.length,
      'common answers',
      'and',
      aiCommonAnswers.length + aiOtherAnswers.length,
      'total answers',
    );
  }

  commonPossibleAnswers = nextCommonAnswers;
  otherPossibleAnswers = nextOtherAnswers;

  console.log('\nNext turn!\n');
}
