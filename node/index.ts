import { createRequire } from 'module';
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { dirname } from 'path';
import { URL } from 'url';

const require = createRequire(import.meta.url);
const cpuCount = cpus().length - 1;
const allWords = require('./all-words.json') as string[];
const answers = require('./answers.json') as string[];

const allWordsGroups = Array.from({ length: cpuCount }, (_, i) =>
  allWords.slice(
    i * Math.round(allWords.length / cpuCount),
    (i + 1) * Math.round(allWords.length / cpuCount),
  ),
);

console.log(allWordsGroups.map((group) => group.length));

const promises = allWordsGroups.map(async (wordGroup) => {
  const worker = new Worker(new URL(dirname(import.meta.url) + '/worker.ts'), {
    workerData: {
      answers,
      guesses: wordGroup,
    },
  });

  return new Promise((resolve, reject) => {
    worker.on('message', resolve);
    worker.on('error', reject);
  });
});

Promise.all(promises).then((resultSets) => {
  const averageEliminatedCounts = resultSets.flat() as [string, number][];
  averageEliminatedCounts.sort((a, b) => b[1] - a[1]);
  console.log(averageEliminatedCounts.slice(0, 10));
});
