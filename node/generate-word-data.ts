import { createRequire } from 'module';
import { writeFile, readFile } from 'fs/promises';
import { URL } from 'url';
import { lines } from './stream-utils.js';

const require = createRequire(import.meta.url);
const allWords = require('./all-words.json') as string[];
const commonWords = (
  await readFile(new URL('./en_5letter.txt', import.meta.url), {
    encoding: 'utf8',
  })
).split('\n');

const orderedAllWords = [...new Set<string>([...commonWords, ...allWords])];
const commonWordCutoff = 4000;

await writeFile(
  new URL('./word-data.json', import.meta.url),
  JSON.stringify({
    common: orderedAllWords.slice(0, commonWordCutoff),
    other: orderedAllWords.slice(commonWordCutoff),
  }),
);

process.exit();
