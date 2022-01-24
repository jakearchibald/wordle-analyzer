import { createRequire } from 'module';
import { writeFile } from 'fs/promises';
import { URL } from 'url';
import { getEliminationAveragesMT } from './get-elimination-averages-mt.js';

const require = createRequire(import.meta.url);
const allWords = require('./all-words.json') as string[];

const averageEliminatedCounts = (
  await getEliminationAveragesMT(allWords, allWords)
).sort((a, b) => b[1] - a[1]);

await writeFile(
  new URL('./eliminated-counts.json', import.meta.url),
  JSON.stringify(averageEliminatedCounts),
);

console.log(averageEliminatedCounts.slice(0, 10));

process.exit();
