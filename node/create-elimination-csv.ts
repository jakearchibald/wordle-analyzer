import { createRequire } from 'module';
import { writeFile, readFile } from 'fs/promises';
import { URL } from 'url';

const require = createRequire(import.meta.url);
const answers = require('./answers.json') as string[];
const commonWords = (
  await readFile(new URL('./en_5letter.txt', import.meta.url), {
    encoding: 'utf8',
  })
).split('\n');
const answersSet = new Set(answers);

const csvLines = commonWords.map((word, i) => {
  answersSet.delete(word);
  return `${i},${answersSet.size}`;
});

await writeFile(
  new URL('./eliminations.csv', import.meta.url),
  csvLines.join('\n'),
);
