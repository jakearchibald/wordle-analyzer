import { createRequire } from 'module';
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { URL } from 'url';
import { writeFile } from 'fs/promises';

const require = createRequire(import.meta.url);
const workerCount = cpus().length - 1;
const allWords = require('./all-words.json') as string[];
const answers = require('./answers.json') as string[];

const groupSize = Math.ceil(allWords.length / workerCount);
const allWordsGroups = Array.from({ length: workerCount }, (_, i) =>
  allWords.slice(i * groupSize, (i + 1) * groupSize),
);

console.log(allWordsGroups.map((group) => group.length));
console.log(allWordsGroups.map((group) => group[0]));

let done = 0;
const expected = answers.length * allWordsGroups.length;

const promises = allWordsGroups.map((wordGroup) => {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), {
    workerData: {
      answers,
      guesses: wordGroup,
    },
  });

  return new Promise<[string, number][]>((resolve, reject) => {
    worker.on('message', (message) => {
      if (typeof message !== 'string') {
        resolve(message);
        return;
      } else if (message === 'answer-done') {
        done++;
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(
          `${done}/${expected} (${Math.round((done / expected) * 100)}%)`,
        );
      }
    });
    worker.on('error', reject);
  });
});

Promise.all(promises).then(async (resultSets) => {
  const averageEliminatedCounts = resultSets.flat();
  averageEliminatedCounts.sort((a, b) => b[1] - a[1]);
  await writeFile(
    new URL('./eliminated-counts.json', import.meta.url),
    JSON.stringify(averageEliminatedCounts),
  );
  console.log(averageEliminatedCounts.slice(0, 10));
});
