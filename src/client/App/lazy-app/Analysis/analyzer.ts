import workerURL from 'entry-url:workers/analyze';
import {
  AIPlay,
  CellColors,
  Clue,
  GuessAnalysis,
  RemainingAnswers,
} from 'shared-types/index';

// Default to 4, since this value isn't given in Safari.
const workerCount = navigator.hardwareConcurrency || 4;
const mainWorker = new Worker(workerURL);
const subWorkers = Array.from(
  { length: workerCount },
  () => new Worker(workerURL),
);

for (const subWorker of subWorkers) {
  const channel = new MessageChannel();
  subWorker.postMessage({ action: 'listen-to-port', port: channel.port1 }, [
    channel.port1,
  ]);
  mainWorker.postMessage({ action: 'add-thread-port', port: channel.port2 }, [
    channel.port2,
  ]);
}

interface AnalyzeGuessOptions {
  remainingAnswers?: RemainingAnswers;
  onProgress?: (done: number, expecting: number) => void;
}

export function analyzeGuess(
  guess: string,
  answer: string,
  previousClues: Clue[],
  { remainingAnswers, onProgress }: AnalyzeGuessOptions = {},
): Promise<GuessAnalysis> {
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
}

export function aiPlay(
  answer: string,
  previousClues: Clue[],
  { remainingAnswers, onProgress }: AnalyzeGuessOptions = {},
): Promise<AIPlay> {
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
}

export function getGuessesColors(
  answer: string,
  guesses: string[],
): Promise<CellColors[]> {
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
}

export function getInvalidWords(words: string[]): Promise<string[]> {
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
}
