// This script takes https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/en/en_full.txt
// and creates a list of only 5-letter words
import { createRequire } from 'module';
import fs from 'fs';
import { Transform } from 'stream';
import { URL } from 'url';
import { addNewline, lines } from './stream-utils.js';

const require = createRequire(import.meta.url);
const allWords = require('./all-words.json') as string[];
const wordSet = new Set(allWords);

const readStream = fs.createReadStream(
  new URL('./en_full.txt', import.meta.url),
  {
    encoding: 'utf8',
  },
);

export function only5LetterWords() {
  return new Transform({
    transform(line: string, encoding, callback) {
      const [word, frequency] = line.trim().split(' ');
      if (/^[a-z]{5}$/.test(word) && wordSet.has(word)) {
        this.push(`${word} ${frequency}`);
      }
      callback();
    },
    encoding: 'utf8',
    decodeStrings: false,
  });
}

const writeStream = fs.createWriteStream(
  new URL('./en_5letter.txt', import.meta.url),
  { encoding: 'utf8' },
);

readStream
  .pipe(lines())
  .pipe(only5LetterWords())
  .pipe(addNewline())
  .pipe(writeStream);
