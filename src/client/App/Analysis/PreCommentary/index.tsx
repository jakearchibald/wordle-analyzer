import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import { GuessAnalysis, RemainingAnswers } from 'shared-types/index';

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
            <strong>{remainingCount} words</strong>, and this tool considers{' '}
            <strong>{guessAnalysis.beforeRemainingCounts.common}</strong> of
            them to be 'common', or at least more common than the others.
            However, not all Wordle answers are common words.
          </p>
          <p>
            The first play should aim to eliminate as many words as possible.
            The AI always plays "lares" which eliminates the most possibilities
            on average. But, the thing about averages… well let's just see what
            happens:
          </p>
        </>
      );
    }

    const remainingList = remainingCount < 30 && remainingAnswers && (
      <ul class={styles.remainingList}>
        {[...remainingAnswers.common, ...remainingAnswers.other].map(
          (word, i) => (
            <li
              class={styles.remainingWord}
              style={{ opacity: i < remainingAnswers.common.length ? 1 : 0.5 }}
            >
              {[...word].map((letter) => (
                <span class={styles.remainingLetter}>
                  {letter.toUpperCase()}
                </span>
              ))}
            </li>
          ),
        )}
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
            {remainingCount} words remaining,{' '}
            {guessAnalysis.beforeRemainingCounts.common} common
          </strong>
          .
        </span>
      );

    const advice =
      remainingCount === 1
        ? []
        : guessAnalysis.beforeRemainingCounts.common === 0
        ? [
            <>
              The answer is an uncommon word, making this very tricky. There
              isn't much of a strategy here, aside from coming up with actual
              words that fit the clues.
            </>,
          ]
        : guessAnalysis.beforeRemainingCounts.common === 1
        ? [
            <>
              Not all Wordle answers are common words, but there's one there for
              the taking. If "{remainingAnswers!.common[0]}" was the only
              'common' word I could think of, I'd totally play it.
            </>,
          ]
        : guessAnalysis.beforeRemainingCounts.common === 2
        ? [
            <>
              Not all Wordle answers are common words, but if I managed to think
              of both of those, I'd flip a coin and play one of them.
            </>,
          ]
        : turn === 5
        ? [
            <>
              I hate it when this happens, but here we are. Last chance.
              Hit-and-hope!
            </>,
          ]
        : guessAnalysis.beforeRemainingCounts.common < 5
        ? [
            <>
              Ok, this is tough. The trick here is realising that there are
              still multiple likely answers, rather than playing the first thing
              that comes to mind.
            </>,
            <>
              Definitely play one of the possible answers, preferably a common
              word, but as a contingency plan, maybe there's one that has a
              greater chance of eliminating more of the others?
            </>,
          ]
        : remainingCount < 10
        ? [
            <>
              Ok, this is tough. The trick here is realising that there are
              still multiple possible answers, rather than playing the first
              thing that comes to mind.
            </>,
            <>
              Definitely play one of the possible answers, but as a contingency
              plan, maybe there's one that has a greater chance of eliminating
              more of the others?
            </>,
          ]
        : remainingCount < 30
        ? [
            <>
              With this many answers still in play, it's probably best to try
              and eliminate as many as possible, rather than go for a win this
              turn.
            </>,
            <>
              If there's a possible answer that achieves that, that's probably
              the best play.
            </>,
          ]
        : turn < 3
        ? [
            <>
              It's still early in the game. Try to eliminate as many answers as
              possible. This isn't 'hard mode', so avoid playing letters that
              you already know are (or aren't) in the answer.
            </>,
          ]
        : [
            <>
              Don't get nervous. Try to eliminate as many answers as possible.
              This isn't 'hard mode', so avoid playing letters that you already
              know are (or aren't) in the answer.
            </>,
          ];

    if (remainingList) {
      return (
        <>
          <p>{remainingSpan}</p>
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
