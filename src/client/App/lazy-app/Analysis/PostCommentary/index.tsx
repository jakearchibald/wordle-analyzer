import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import * as utilStyles from '../../../../utils.module.css';
import {
  AIStrategy,
  GuessAnalysis,
  PlayAnalysis,
  RemainingAnswers,
} from 'shared-types/index';
import { formatNumber } from '../../utils';

// prettier-ignore
const rude = new Set([
  'boner', 'pussy', 'semen', 'farts', 'minge', 'twats', 'spunk', 'prick', 'titty', 'craps', 'balls', 'penis', 'arses', 'cunts', 'fucks', 'jizzy', 'wanks', 'turds',
  'shits', 'asses', 'cocks', 'butts', 'dicks', 'boobs', 'cunty', 'fanny', 'shite', 'poops', 'shart', 'dongs', 'erect', 'pubes', 'clits', 'pissy', 'bitch', 'whore',
  'sluts', 'nonce', 'colon', 'porno',
]);

// prettier-ignore
const worstStarters = new Set([
  'cocco', 'yukky', 'fuzzy', 'hyphy', 'immix', 'fuffy', 'gyppy', 'xylyl',
]);

// prettier-ignore
const claimedBest = new Set([
  'soare', 'salet', 'arose', 'tares', 'saine', 'alert', 'later', 'alter', 'irate',
]);

function numUniqueVowelsUsed(guess: string) {
  const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
  for (const letter of guess) vowels.delete(letter);
  return 5 - vowels.size;
}

function getCommentaryOnFirstGuess(guess: string) {
  if (guess === 'salet') {
    return (
      <p>
        Ohh, I guess someone watched{' '}
        <a target="_blank" href="https://www.youtube.com/watch?v=fRed0Xmc2Wg">
          3Blue1Brown
        </a>
        ? "Salet" is their recommended starting word. It isn't the same as the
        AI's preferred choice here, and I'm not sure how much of that is down to
        a difference in statistical methods, and how much is down to a different
        source of common words.
      </p>
    );
  }
  if (guess === 'crane') {
    return (
      <p>
        Ohh, I guess someone watched{' '}
        <a target="_blank" href="https://www.youtube.com/watch?v=v68zYyaEmEA">
          3Blue1Brown
        </a>
        ? Well, bad news,{' '}
        <a target="_blank" href="https://www.youtube.com/watch?v=fRed0Xmc2Wg">
          they had a bug in their code
        </a>
        .
      </p>
    );
  }
  if (guess === 'roate') {
    return (
      <p>
        A few folks have claimed that "roate" is the best starting word, but
        it's based on the answer being from Wordle's answer set. That's cheating
        if you ask me. But also, if you're going to use that technique, you may
        as well discard answers that have already been Wordle answers. When you
        do that, the best starting word changes. No, I'm not telling.
      </p>
    );
  }
  if (guess === 'raise') {
    return (
      <p>
        "raise" is the best starting word if you limit the analysis to Wordle's
        answer set, which kinda feels like cheating. However, it's the word I
        tend to start with, so I'm not going to judge too much.
      </p>
    );
  }
  if (guess === 'lares') {
    return <p>Aha, someone's learned a thing or two from the AI I see!</p>;
  }
  if (claimedBest.has(guess)) {
    return (
      <p>
        I've seen a few folks claim "{guess}" is the best starting word, but I
        haven't been able to recreate that result. I wonder if they had a bug in
        their code? Anyway, it's still a pretty good starter.
      </p>
    );
  }
  if (guess === 'rathe') {
    return (
      <p>
        I once told folks on Twitter that "rathe" was the best starting word.
        But, err, there was a bug in my code. If you've ever started with
        "rathe" because I told you to… sorry!
      </p>
    );
  }
  if (guess === 'noise') {
    return (
      <p>
        "noise" is{' '}
        <a target="_blank" href="https://twitter.com/susie_dent">
          Susie Dent
        </a>
        's favorite starting word. That's gotta be worth something.
      </p>
    );
  }
  if (guess === 'rapes') {
    return (
      <p>
        <em>Sighhhhhhh</em>. That word actually performs pretty well on average,
        but you're not actually going to share these results are you?
      </p>
    );
  }
  if (guess === 'arsed') {
    return <p>Whey! "arsed" is my favorite naughty word to start with.</p>;
  }
  if (guess === 'smart') {
    return <p>Huh, that's the word my girlfriend always starts with.</p>;
  }
  if (rude.has(guess)) {
    return (
      <p>
        Ahh, someone likes to start with a bit of a naughty word, or is this
        actually{' '}
        <a href="https://www.lewdlegame.com/" target="_blank">
          Lewdle
        </a>
        ? My favorite 'cheeky' word to start with is "arsed". Because a) I'm
        British, and b) It actually performs pretty well!
      </p>
    );
  }
  if (worstStarters.has(guess)) {
    return <p>"{guess}"? Really?? This isn't going to go well.</p>;
  }
  if (numUniqueVowelsUsed(guess) === 4) {
    return (
      <p>
        Almost all of the vowels in that one! Knowing which vowels are in the
        answer is useful, but don't forget that consonants are useful too.
      </p>
    );
  }
}

interface Props {
  turn: number;
  guessAnalysis: GuessAnalysis;
  beforeRemainingAnswers: RemainingAnswers | undefined;
  answer: string;
}

interface State {}

export default class PostCommentary extends Component<Props, State> {
  render({
    turn,
    guessAnalysis,
    beforeRemainingAnswers,
    answer,
  }: RenderableProps<Props>) {
    if (turn === 0) {
      return (
        <>
          {getCommentaryOnFirstGuess(guessAnalysis.plays.user.guess)}
          <p>
            The AI always starts with "lares" which eliminates the most
            possibilities on average.{' '}
            {guessAnalysis.plays.bestPlay === guessAnalysis.plays.user && (
              <>
                But as was the case here, the average doesn't always turn out to
                be the best.
              </>
            )}
          </p>
        </>
      );
    }

    if (turn === 5) {
      if (guessAnalysis.plays.user.guess !== answer) {
        return <p>Bad luck! The correct answer was "{answer}".</p>;
      }
      if (
        beforeRemainingAnswers &&
        beforeRemainingAnswers.common.length +
          beforeRemainingAnswers.other.length !==
          1
      ) {
        return <p>Phew! Just in the nick of time!</p>;
      }
      return;
    }

    if (guessAnalysis.plays.user.guess === answer) return;

    const commonAnswersJustEliminated =
      beforeRemainingAnswers &&
      beforeRemainingAnswers.common.length !== 0 &&
      guessAnalysis.plays.user.remainingAnswers.common.length === 0;

    if (commonAnswersJustEliminated) {
      return (
        <p>Oh no! That's all the common answers gone. This was a tricky one…</p>
      );
    }
  }
}
