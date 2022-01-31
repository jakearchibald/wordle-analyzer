import workerURL from 'entry-url:workers/analyze';
import { GuessAnalysis } from 'shared-types/index';

const workerCount = navigator.hardwareConcurrency;
const workerQueue: Promise<unknown> = Promise.resolve();
const mainWorker = new Worker(workerURL);
const subWorkers = Array.from(
  { length: workerCount },
  () => new Worker(workerURL),
);

export function analyzeGuess(
  guess: string,
  remainingAnswers?: string[],
): GuessAnalysis {}
