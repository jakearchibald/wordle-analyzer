import { createRequire } from 'module';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { URL } from 'url';
import { lines } from './stream-utils.js';

const require = createRequire(import.meta.url);
const allWords = require('./all-words.json') as string[];
const commonWords = await (async () => {
  const commonWords: string[] = [];

  const readStream = fs.createReadStream(
    new URL('./en_5letter.txt', import.meta.url),
    {
      encoding: 'utf8',
    },
  );

  for await (const line of readStream.pipe(lines())) {
    const [word] = line.trim().split(' ');
    commonWords.push(word);
  }

  return commonWords;
})();

const orderedAllWords = [...new Set<string>([...commonWords, ...allWords])];

await writeFile(
  new URL('./word-data.json', import.meta.url),
  JSON.stringify({
    common: orderedAllWords.slice(0, commonWords.length),
    other: orderedAllWords.slice(commonWords.length),
  }),
);

process.exit();
