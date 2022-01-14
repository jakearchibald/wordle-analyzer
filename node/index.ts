import { createRequire } from 'module';
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { URL } from 'url';

const require = createRequire(import.meta.url);
const cpuCount = cpus().length - 1;
const allWords = require('./all-words.json') as string[];
const answers = require('./answers.json') as string[];

const groupSize = Math.ceil(answers.length / cpuCount);
const allWordsGroups = Array.from({ length: cpuCount }, (_, i) =>
  allWords.slice(i * groupSize, (i + 1) * groupSize),
);

let done = 0;

const promises = allWordsGroups.map(async (wordGroup, i) => {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), {
    workerData: {
      answers,
      guesses: wordGroup,
      guessesOffset: groupSize * i,
    },
  });

  return new Promise<void>((resolve, reject) => {
    worker.on('message', (message) => {
      if (message === 'done') {
        resolve();
        return;
      } else if (message === 'part-done') {
        done++;
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(
          `${done}/${allWords.length} (${Math.round(
            (done / allWords.length) * 100,
          )}%)`,
        );
      }
    });
    worker.on('error', reject);
  });
});

Promise.all(promises).then(async () => {
  console.log('done!');
});
