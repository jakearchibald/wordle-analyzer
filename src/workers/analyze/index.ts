import dataUrl from 'url:./word-data.json';
import { GuessAnalysis, FiveLetters, Clue } from 'shared-types/index';

const wordData = fetch(dataUrl).then(
  (res) => res.json() as Promise<typeof import('./word-data.json')>,
);

type Channel = { port1: MessagePort; port2: MessagePort };
const threadChannels: Channel[] = [];

/**
 * Generate the clues given by a particular guess.
 */
export function generateClue(answer: string, guess: string): Clue {
  const remainingAnswerLetters = [...answer];
  const positionalMatches: FiveLetters = ['', '', '', '', ''];
  const positionalNotMatches: FiveLetters = ['', '', '', '', ''];
  const additionalRequiredLetters: string[] = [];
  const remainingMustNotContain = new Set<string>();

  // Green squares take priority over yellow squares,
  // so those need to be resolved first.
  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i];

    // If there's an exact positional match,
    // This is a green square in Wordle.
    if (answer[i] === letter) {
      remainingAnswerLetters.splice(remainingAnswerLetters.indexOf(letter), 1);
      // Valid answers must also have this positional match
      positionalMatches[i] = letter;
    }
  }

  for (let i = 0; i < guess.length; i++) {
    // If we've already handled this with a green square, skip.
    if (positionalMatches[i]) continue;

    const letter = guess[i];
    // Otherwise, if the answer contains the letter (and it hasn't already been matched).
    // This is a yellow square in Wordle.
    if (remainingAnswerLetters.includes(letter)) {
      remainingAnswerLetters.splice(remainingAnswerLetters.indexOf(letter), 1);
      // Valid answers must not have this positional match, otherwise it'd be a green square
      positionalNotMatches[i] = letter;
      // Valid answers must contain this letter
      additionalRequiredLetters.push(letter);
    }
    // The guess letter isn't in remainingAnswerLetters.
    // It might still be in the answer, but we already know about it via a green or yellow square.
    // This catches cases where 'brass' is guessed and the answer is 'trash'.
    // The first 's' will be recorded in positionalMatches, but since we've landed here for the 2nd 's',
    // we know the answer only contains one 's'.
    else {
      remainingMustNotContain.add(letter);
    }
  }

  return {
    positionalMatches,
    positionalNotMatches,
    additionalRequiredLetters,
    remainingMustNotContain,
  };
}

async function analyzeGuess(
  guess: string,
  answer: string,
  previousClues: Clue[],
  remainingAnswers?: string[],
): Promise<GuessAnalysis> {
  if (threadChannels.length === 0) {
    throw Error('No worker threads available');
  }

  const { words } = await wordData;
  const guessInDictionary = words.includes(guess);
  const clue = generateClue(answer, guess);

  // TODO: next, handle previousClues and create guessRedundancy
  return {
    guessInDictionary,
    clue,
  };
}

function messageListener(event: MessageEvent) {
  if (event.data.action === 'listen-to-port') {
    (event.data.port as MessagePort).addEventListener(
      'message',
      messageListener,
    );
    return;
  }
  if (event.data.action === 'add-channels') {
    threadChannels.push(...(event.data.channels as Channel[]));
    return;
  }
}

addEventListener('message', messageListener);
