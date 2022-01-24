import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { URL } from 'url';
import type { EliminationAverages } from './utils';

const workerCount = cpus().length - 1;
const workers = Array.from(
  { length: workerCount },
  () => new Worker(new URL('./utils.ts', import.meta.url)),
);

let queue: Promise<unknown> = Promise.resolve();

export function getEliminationAveragesMT(
  answers: string[],
  guesses: string[],
): Promise<EliminationAverages> {
  const result: Promise<EliminationAverages> = queue
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
        workers.map(
          (worker, i) =>
            new Promise<EliminationAverages>((resolve, reject) => {
              const guessesGroup = guessesGroups[i];
              worker.postMessage({
                answers,
                guesses: guessesGroup,
              });

              worker.on('message', (message) => {
                if (typeof message !== 'string') {
                  resolve(message);
                  return;
                } else if (message === 'answer-done') {
                  done++;
                  process.stdout.clearLine(0);
                  process.stdout.cursorTo(0);
                  process.stdout.write(
                    `${done}/${expected} (${Math.round(
                      (done / expected) * 100,
                    )}%)`,
                  );
                }
              });
              worker.on('error', reject);
            }),
        ),
      );

      const averageEliminatedCounts = resultSets.flat();
      return averageEliminatedCounts;
    });

  queue = result;
  return result;
}
