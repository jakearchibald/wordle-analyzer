import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import { GuessAnalysis } from 'shared-types/index';
import Guess from 'client/App/Guess';

interface Props {
  first: boolean;
  guessAnalysis: GuessAnalysis;
}

interface State {}

const boolToYesNo = (bool: boolean) => (bool ? 'Yes' : 'No');
const toTwoDecimalPlaces = (num: number) => Math.round(num * 100) / 100;

export default class AnalysisEntry extends Component<Props, State> {
  render({ guessAnalysis, first }: RenderableProps<Props>) {
    const plays = [guessAnalysis.plays.user, guessAnalysis.plays.ai];
    const totalRemaining =
      guessAnalysis.beforeRemainingCounts.common +
      guessAnalysis.beforeRemainingCounts.other;

    const userRemainingAnswers = guessAnalysis.plays.user.remainingAnswers;

    return (
      <div class={styles.analysisEntry}>
        <div class={styles.analysisGrid}>
          {plays.map((play, i) => {
            let row = 1;

            return (
              <>
                <h2
                  class={styles.mainHeading}
                  style={{ gridArea: `${row++}/${i + 1}` }}
                >
                  {i === 0 ? 'You played' : 'AI would play'}
                </h2>
                <div style={{ gridArea: `${row++}/${i + 1}` }}>
                  <Guess value={play.guess} cellClues={play.colors} />
                </div>
                <h3
                  class={styles.subHeading}
                  style={{ gridArea: `${row++}/1 / span 1 /span 2` }}
                >
                  Possible answer?
                </h3>
                <div style={{ gridArea: `${row++}/${i + 1}` }}>
                  <div>{boolToYesNo(play.unusedClues.length === 0)}</div>
                  {play.unusedClues.length !== 0 && (
                    <ul>
                      {play.unusedClues.map((clue) => (
                        <li>{clue}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {!first && (
                  <>
                    <h3
                      class={styles.subHeading}
                      style={{ gridArea: `${row++}/1 / span 1 /span 2` }}
                    >
                      Valid 'hard mode' guess?
                    </h3>
                    <div style={{ gridArea: `${row++}/${i + 1}` }}>
                      {boolToYesNo(play.validForHardMode)}
                    </div>
                  </>
                )}
                <h3
                  class={styles.subHeading}
                  style={{ gridArea: `${row++}/1 / span 1 /span 2` }}
                >
                  Common word?
                </h3>
                <div style={{ gridArea: `${row++}/${i + 1}` }}>
                  {boolToYesNo(play.commonWord)}
                </div>
                <h3
                  class={styles.subHeading}
                  style={{ gridArea: `${row++}/1 / span 1 /span 2` }}
                >
                  Average eliminations
                </h3>
                <div style={{ gridArea: `${row++}/${i + 1}` }}>
                  {play.averageRemaining
                    ? toTwoDecimalPlaces(
                        (1 - play.averageRemaining.all / totalRemaining) * 100,
                      ) +
                      '%' +
                      ` (leaving ${toTwoDecimalPlaces(
                        play.averageRemaining.all,
                      )})`
                    : 'Word not found'}
                </div>
                <h3
                  class={styles.subHeading}
                  style={{ gridArea: `${row++}/1 / span 1 /span 2` }}
                >
                  Actual eliminations
                </h3>
                <div style={{ gridArea: `${row++}/${i + 1}` }}>
                  {toTwoDecimalPlaces(
                    (1 -
                      (play.remainingAnswers.common.length +
                        play.remainingAnswers.other.length) /
                        totalRemaining) *
                      100,
                  ) +
                    '%' +
                    ` (leaving ${
                      play.remainingAnswers.common.length +
                      play.remainingAnswers.other.length
                    })`}
                </div>
              </>
            );
          })}
        </div>

        {userRemainingAnswers.common.length +
          userRemainingAnswers.other.length <
          30 && (
          <ul class={styles.remainingList}>
            {[
              ...userRemainingAnswers.common,
              ...userRemainingAnswers.other,
            ].map((remaining) => (
              <li>
                <Guess value={remaining} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}
