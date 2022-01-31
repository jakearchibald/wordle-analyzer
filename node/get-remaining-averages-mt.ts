import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { URL } from 'url';
import type { RemainingAverages } from './utils';

const workerCount = cpus().length - 1;
const workers = Array.from(
  { length: workerCount },
  () => new Worker(new URL('./utils.ts', import.meta.url)),
);

let queue: Promise<unknown> = Promise.resolve();

export function getRemainingAveragesMT(
  commonAnswers: string[],
  otherAnswers: string[],
  guesses: string[],
): Promise<[RemainingAverages, RemainingAverages]> {
  const result: Promise<[RemainingAverages, RemainingAverages]> = queue
    .catch(() => {})
    .then(async () => {
      let done = 0;
      const expected = guesses.length;

      const groupSize = Math.ceil(guesses.length / workerCount);
      const guessesGroups = Array.from({ length: workerCount }, (_, i) =>
        guesses.slice(i * groupSize, (i + 1) * groupSize),
      );

      process.stdout.write('');

      const resultSets = await Promise.all(
        guessesGroups.map(
          (guessesGroup, i) =>
            new Promise<[RemainingAverages, RemainingAverages]>(
              (resolve, reject) => {
                const worker = workers[i];
                worker.postMessage({
                  commonAnswers,
                  otherAnswers,
                  guesses: guessesGroup,
                });

                worker.on('message', (message) => {
                  process.stdout.clearLine(0);
                  process.stdout.cursorTo(0);

                  if (typeof message !== 'string') {
                    resolve(message);
                    return;
                  } else if (message === 'answer-done') {
                    done++;
                    process.stdout.write(
                      `${done}/${expected} (${Math.round(
                        (done / expected) * 100,
                      )}%)`,
                    );
                  }
                });
                worker.on('error', reject);
              },
            ),
        ),
      );

      const fullCommonAverages = resultSets
        .map((resultsSet) => resultsSet[0])
        .flat()
        .sort((a, b) => a[1] - b[1]);
      const fullOtherAverages = resultSets
        .map((resultsSet) => resultsSet[1])
        .flat()
        .sort((a, b) => a[1] - b[1]);

      return [fullCommonAverages, fullOtherAverages];
    });

  queue = result;
  return result;
}
