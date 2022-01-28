// This script takes https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_full.txt
// and creates a list of only 5-letter words
import { createRequire } from 'module';
import fs from 'fs';
import { URL } from 'url';
import { lines } from './stream-utils.js';

const require = createRequire(import.meta.url);
const allWords = require('./all-words.json') as string[];
const answers = require('./answers.json') as string[];
const eliminatedCounts = require('./eliminated-counts.json') as [
  string,
  number,
][];
const eliminatedCountsMap = Object.fromEntries(eliminatedCounts);

const readStream = fs.createReadStream(
  new URL('./en_5letter.txt', import.meta.url),
  {
    encoding: 'utf8',
  },
);

function toTwoDecimalPlaces(num: number) {
  return Math.round(num * 100) / 100;
}

const commonWords: string[] = [];

for await (const line of readStream.pipe(lines())) {
  const [word] = line.trim().split(' ');
  commonWords.push(word);
}

const words = [...new Set<string>([...commonWords, ...answers, ...allWords])];
const initialAverageEliminations = words.map((word) =>
  toTwoDecimalPlaces(eliminatedCountsMap[word]),
);

await fs.promises.writeFile(
  new URL('./word-data.json', import.meta.url),
  JSON.stringify({
    words,
    initialAverageEliminations,
  }),
  {
    encoding: 'utf8',
  },
);
