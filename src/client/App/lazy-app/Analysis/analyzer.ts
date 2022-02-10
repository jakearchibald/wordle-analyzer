import workerURL from 'entry-url:workers/analyze';
import {
  AIPlay,
  CellColors,
  Clue,
  GuessAnalysis,
  RemainingAnswers,
} from 'shared-types/index';
import { doAbortable } from '../utils';

// Default to 4, since this value isn't given in Safari.
const workerCount = navigator.hardwareConcurrency || 4;
let mainWorker: Worker;
let subWorkers: Worker[];

function cycleWorkers() {
  if (mainWorker || subWorkers) {
    for (const worker of [mainWorker, ...subWorkers]) {
      worker.terminate();
    }
  }

  mainWorker = new Worker(workerURL);
  subWorkers = Array.from({ length: workerCount }, () => new Worker(workerURL));

  for (const subWorker of subWorkers) {
    const channel = new MessageChannel();
    subWorker.postMessage({ action: 'listen-to-port', port: channel.port1 }, [
      channel.port1,
    ]);
    mainWorker.postMessage({ action: 'add-thread-port', port: channel.port2 }, [
      channel.port2,
    ]);
  }
}

cycleWorkers();

function abortableWorkerFunction<R>(
  signal: AbortSignal,
  callback: () => R | Promise<R>,
): Promise<R> {
  return doAbortable(signal, (setAbortAction) => {
    setAbortAction(() => cycleWorkers());
    return callback();
  });
}

interface AnalyzeGuessOptions {
  remainingAnswers?: RemainingAnswers;
  onProgress?: (done: number, expecting: number) => void;
}

export function analyzeGuess(
  signal: AbortSignal,
  guess: string,
  answer: string,
  previousClues: Clue[],
  { remainingAnswers, onProgress }: AnalyzeGuessOptions = {},
): Promise<GuessAnalysis> {
  return abortableWorkerFunction(signal, () => {
    const { port1, port2 } = new MessageChannel();

    mainWorker.postMessage(
      {
        action: 'analyze-guess',
        guess,
        answer,
        previousClues,
        remainingAnswers,
        returnPort: port2,
      },
      [port2],
    );

    return new Promise<GuessAnalysis>((resolve, reject) => {
      let rafId: number = -1;

      function done() {
        port1.close();
        cancelAnimationFrame(rafId);
      }

      port1.addEventListener('message', (event: MessageEvent) => {
        if (event.data.action === 'done') {
          done();
          resolve(event.data.result);
          return;
        }
        if (event.data.action === 'error') {
          done();
          reject(Error(event.data.message));
          return;
        }
        if (event.data.action === 'progress') {
          cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() =>
            onProgress?.(event.data.done, event.data.expecting),
          );
        }
      });
      port1.start();
    });
  });
}

export function aiPlay(
  signal: AbortSignal,
  answer: string,
  previousClues: Clue[],
  { remainingAnswers, onProgress }: AnalyzeGuessOptions = {},
): Promise<AIPlay> {
  return abortableWorkerFunction(signal, () => {
    const { port1, port2 } = new MessageChannel();

    mainWorker.postMessage(
      {
        action: 'ai-play',
        answer,
        previousClues,
        remainingAnswers,
        returnPort: port2,
      },
      [port2],
    );

    return new Promise<AIPlay>((resolve, reject) => {
      let rafId: number = -1;

      function done() {
        port1.close();
        cancelAnimationFrame(rafId);
      }

      port1.addEventListener('message', (event: MessageEvent) => {
        if (event.data.action === 'done') {
          done();
          resolve(event.data.result);
          return;
        }
        if (event.data.action === 'error') {
          done();
          reject(Error(event.data.message));
          return;
        }
        if (event.data.action === 'progress') {
          cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() =>
            onProgress?.(event.data.done, event.data.expecting),
          );
        }
      });
      port1.start();
    });
  });
}

export function getGuessesColors(
  signal: AbortSignal,
  answer: string,
  guesses: string[],
): Promise<CellColors[]> {
  return abortableWorkerFunction(signal, () => {
    const { port1, port2 } = new MessageChannel();

    mainWorker.postMessage(
      {
        action: 'guesses-colors',
        answer,
        guesses,
        returnPort: port2,
      },
      [port2],
    );

    return new Promise<CellColors[]>((resolve, reject) => {
      function done() {
        port1.close();
      }

      port1.addEventListener('message', (event: MessageEvent) => {
        if (event.data.action === 'done') {
          done();
          resolve(event.data.result);
          return;
        }
        if (event.data.action === 'error') {
          done();
          reject(Error(event.data.message));
          return;
        }
      });
      port1.start();
    });
  });
}

export function getInvalidWords(
  signal: AbortSignal,
  words: string[],
): Promise<string[]> {
  return abortableWorkerFunction(signal, () => {
    const { port1, port2 } = new MessageChannel();

    mainWorker.postMessage(
      {
        action: 'invalid-words',
        words,
        returnPort: port2,
      },
      [port2],
    );

    return new Promise<string[]>((resolve, reject) => {
      function done() {
        port1.close();
      }

      port1.addEventListener('message', (event: MessageEvent) => {
        if (event.data.action === 'done') {
          done();
          resolve(event.data.result);
          return;
        }
        if (event.data.action === 'error') {
          done();
          reject(Error(event.data.message));
          return;
        }
      });
      port1.start();
    });
  });
}
