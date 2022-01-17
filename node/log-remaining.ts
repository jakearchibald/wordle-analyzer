import { createRequire } from 'module';
import { generateRules, possibleAnswer, getBestAnswers } from './worker.js';

const require = createRequire(import.meta.url);
const allWords = require('./all-words.json') as string[];
const answers = require('./answers.json') as string[];

const [
  positionalMatches,
  positionalNotMatches,
  additionalKnownLetters,
  remainingMustNotContain,
] = generateRules('shire', 'arsed');

const possibleAnswers = answers.filter((answer) =>
  possibleAnswer(
    answer,
    positionalMatches,
    positionalNotMatches,
    additionalKnownLetters,
    remainingMustNotContain,
  ),
);

console.log(possibleAnswers, possibleAnswers.length);

const bestAnswers = getBestAnswers(possibleAnswers, allWords);
bestAnswers.sort((a, b) => b[1] - a[1]);

console.log('Playing', bestAnswers[0][0], bestAnswers[0][1]);

console.log(
  possibleAnswer(
    'shire',
    positionalMatches,
    positionalNotMatches,
    additionalKnownLetters,
    remainingMustNotContain,
  ),
);

{
  debugger;
  const [
    positionalMatches,
    positionalNotMatches,
    additionalKnownLetters,
    remainingMustNotContain,
  ] = generateRules('shire', bestAnswers[0][0]);

  const filteredAnswers = possibleAnswers.filter((answer) =>
    possibleAnswer(
      answer,
      positionalMatches,
      positionalNotMatches,
      additionalKnownLetters,
      remainingMustNotContain,
    ),
  );

  console.log(
    possibleAnswer(
      'shire',
      positionalMatches,
      positionalNotMatches,
      additionalKnownLetters,
      remainingMustNotContain,
    ),
  );

  console.log(filteredAnswers, filteredAnswers.length);
}
