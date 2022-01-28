// This script takes https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_full.txt
// and creates a list of only 5-letter words
import { createRequire } from 'module';
import fs from 'fs';
import { URL } from 'url';
import { lines } from './stream-utils.js';

const require = createRequire(import.meta.url);
const allWords = require('./answers.json') as string[];
const answerSet = new Set(allWords);

const readStream = fs.createReadStream(
  new URL('./en_5letter.txt', import.meta.url),
  {
    encoding: 'utf8',
  },
);

const outputLines: string[] = [];
let i = 0;

for await (const line of readStream.pipe(lines())) {
  const [word] = line.trim().split(' ');

  if (answerSet.has(word)) {
    answerSet.delete(word);
    outputLines.push(`${i},${answerSet.size}`);
    if (answerSet.size === 0) break;
  }
  i++;
}

await fs.promises.writeFile(
  new URL('./popularity.csv', import.meta.url),
  outputLines.join('\n') + '\n',
  {
    encoding: 'utf8',
  },
);
