import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import * as utilStyles from '../../../../utils.module.css';
import {
  AIStrategy,
  GuessAnalysis,
  RemainingAnswers,
} from 'shared-types/index';
import { formatNumber } from '../../utils';

const maxItemsToDisplay = 30;

const enum RemainingItemsType {
  None,
  CommonOnly,
  All,
}

interface Props {
  turn: number;
  guessAnalysis: GuessAnalysis;
  remainingAnswers: RemainingAnswers | undefined;
}

interface State {}

export default class PreCommentary extends Component<Props, State> {
  render({ turn, guessAnalysis, remainingAnswers }: RenderableProps<Props>) {
    const remainingCount =
      guessAnalysis.beforeRemainingCounts.common +
      guessAnalysis.beforeRemainingCounts.other;

    if (turn === 0) {
      return (
        <>
          <p>
            Another day, another Wordle! The Wordle dictionary contains{' '}
            <strong>{formatNumber(remainingCount)} words</strong>, and this tool
            considers{' '}
            <strong>
              {formatNumber(guessAnalysis.beforeRemainingCounts.common)}
            </strong>{' '}
            of them to be 'common', or at least more common than the others.
            However, not all Wordle answers are common words.
          </p>
          <p>
            The first play should aim to eliminate as many words as possible,
            preferably common words.
          </p>
        </>
      );
    }

    let remainingItemsToDisplay: string[] | undefined = undefined;
    let remainingItemsType: RemainingItemsType = RemainingItemsType.None;

    if (remainingAnswers) {
      if (remainingCount <= maxItemsToDisplay) {
        remainingItemsType = RemainingItemsType.All;
        remainingItemsToDisplay = [
          ...remainingAnswers.common,
          ...remainingAnswers.other,
        ];
      } else if (remainingAnswers.common.length <= maxItemsToDisplay) {
        remainingItemsType = RemainingItemsType.CommonOnly;
        remainingItemsToDisplay = remainingAnswers.common;
      }
    }

    const remainingList = remainingItemsToDisplay && (
      <ul class={styles.remainingList}>
        {remainingItemsToDisplay.map((word, i) => (
          <li
            style={{ opacity: i < remainingAnswers!.common.length ? 1 : 0.5 }}
          >
            <a
              class={[utilStyles.hiddenLink, styles.remainingWord].join(' ')}
              target="_blank"
              href={`https://en.wiktionary.org/wiki/${word}`}
            >
              {[...word].map((letter) => (
                <span class={styles.remainingLetter}>
                  {letter.toUpperCase()}
                </span>
              ))}
            </a>
          </li>
        ))}
      </ul>
    );

    const remainingSpan =
      remainingCount === 1 ? (
        <span>
          There's only <strong>one answer remaining</strong>. The trick is being
          able to think of it.
        </span>
      ) : (
        <span>
          There are{' '}
          <strong>
            {formatNumber(remainingCount)} words remaining,{' '}
            {formatNumber(guessAnalysis.beforeRemainingCounts.common)} common
          </strong>
          .
        </span>
      );

    const aiStrategy = guessAnalysis.plays.aiStrategy;

    const advice = ((): h.JSX.Element[] => {
      if (remainingCount === 1) return [];

      if (
        turn === 5 &&
        (guessAnalysis.beforeRemainingCounts.common > 2 ||
          (guessAnalysis.beforeRemainingCounts.common === 0 &&
            remainingCount > 2))
      ) {
        return [
          <>
            Uh oh, this isn't looking good! Not much left to do other than cross
            fingers, say a prayer, wish upon a star, and take a guess.
          </>,
        ];
      }

      if (guessAnalysis.beforeRemainingCounts.common === 0) {
        if (remainingCount === 2) {
          return [
            <>
              With no common words remaining, the biggest challenge is thinking
              of any word that fits. The best strategy is to pick the
              least-uncommon of those, but I'd probably just play the first one
              that came to mind.
            </>,
          ];
        }

        if (aiStrategy === AIStrategy.EliminateUncommonWithAnswer) {
          return [
            <>
              With no common words remaining, the biggest challenge is thinking
              of any word that fits. There are answers that eliminate more of
              the other answers, which could be a good play, but playing the
              least-uncommon of the possibilities is also a good bet.
            </>,
            <>
              That said, with uncommon words like this, I'd probably just play
              the first one that came to mind.
            </>,
          ];
        }
        return [
          <>
            With no common words remaining, the biggest challenge is thinking of
            any word that fits. The remaining possibilities have too much in
            common, so rather than going for a win, it's probably better to play
            a non-answer that eliminates many of the possible answers.
          </>,
          <>
            That said, with uncommon words like this, I'd probably just play the
            first one that came to mind.
          </>,
        ];
      }

      if (guessAnalysis.beforeRemainingCounts.common === 1) {
        return [
          <>
            Not all Wordle answers are common words, but most of them are. If "
            {remainingAnswers!.common[0]}" was the only 'common' word I could
            think of, I'd totally play it and hope for the best!
          </>,
        ];
      }

      if (guessAnalysis.beforeRemainingCounts.common === 2) {
        return [
          <>
            {guessAnalysis.beforeRemainingCounts.other !== 0 && (
              <>
                Not all Wordle answers are common words, but most of them are.{' '}
              </>
            )}
            If I managed to think of both of those,{' '}
            {turn === 5 ? (
              <>
                well, with only one guess left there's not much else to do other
                than pick one, and hope it's the winner.
              </>
            ) : (
              <>I'd flip a coin and play one of them.</>
            )}
          </>,
        ];
      }

      const turnInfo =
        turn < 3 ? (
          <>
            It's still early in the game, so there are plenty of guesses
            remaining.
          </>
        ) : (
          <>There aren't many guesses left, but don't panic!</>
        );

      if (guessAnalysis.beforeRemainingCounts.common < 20) {
        if (aiStrategy === AIStrategy.EliminateCommonWithAnswer) {
          return [
            <>
              The trick here is realising that there are still multiple likely
              answers, and doing something smarter than just playing the first
              thing that comes to mind. {turnInfo}
            </>,
            <>
              The ideal strategy is to eliminate as many of the remaining words
              as possible. Playing an already-eliminated-word removes the
              possibility of a win, but perhaps there's a guess that also
              eliminates many of the others? You've got to be in it to win it!
            </>,
          ];
        }
        return [
          <>
            The trick here is realising that there are still multiple likely
            answers, and doing something smarter than just playing the first
            thing that comes to mind. {turnInfo}
          </>,
          <>
            Unfortunately, the remaining words have too much in common, so it's
            better to play an already-eliminated-word that discounts as many of
            the remaining answers as possible. It won't be a winning guess, but
            hopefully it gives enough clues to play a winner for the following
            guess.
          </>,
        ];
      }

      return [
        <>
          With this many words remaining, the best strategy is to play some
          letters that haven't already been played. Don't worry about picking a
          winner yet. {turnInfo}
        </>,
      ];
    })();

    if (remainingList) {
      return (
        <>
          <p>
            {remainingSpan}{' '}
            {remainingItemsType === RemainingItemsType.CommonOnly
              ? 'The common ones are:'
              : remainingCount > 1 && 'They are:'}
          </p>
          {remainingList}
          {advice.map((line) => (
            <p>{line}</p>
          ))}
        </>
      );
    }

    return (
      <>
        <p>
          {remainingSpan} {advice[0]}
        </p>
        {advice.slice(1).map((line) => (
          <p>{line}</p>
        ))}
      </>
    );
  }
}
