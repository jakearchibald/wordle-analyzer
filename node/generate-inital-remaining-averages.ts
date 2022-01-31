import { createRequire } from 'module';
import { writeFile } from 'fs/promises';
import { URL } from 'url';
import { getRemainingAveragesMT } from './get-remaining-averages-mt.js';

const require = createRequire(import.meta.url);
const wordData =
  require('./word-data.json') as typeof import('./word-data.json');

const results = await getRemainingAveragesMT(wordData.common, wordData.other, [
  ...wordData.common,
  ...wordData.other,
]);

function toTwoDecimalPlaces(num: number) {
  return Math.round(num * 100) / 100;
}

await writeFile(
  new URL('./remaining-counts.json', import.meta.url),
  JSON.stringify({
    common: results.common.map(([word, averageRemaining]) => [
      word,
      toTwoDecimalPlaces(averageRemaining),
    ]),
    all: results.all.map(([word, averageRemaining]) => [
      word,
      toTwoDecimalPlaces(averageRemaining),
    ]),
  }),
);

process.exit();
