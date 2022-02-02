import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import * as guessStyles from '../../Guess/styles.module.css';
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
        <table>
          <tr>
            <td></td>
            <th scope="col">You played</th>
            <th scope="col">AI would play</th>
          </tr>
          <tr>
            <th scope="row">Guess</th>
            {plays.map((play) => (
              <td class={guessStyles.small}>
                <Guess value={play.guess} cellClues={play.colors} />
              </td>
            ))}
          </tr>
          {!first && (
            <tr>
              <th scope="row">Possible answer?</th>
              {plays.map((play) => (
                <td>
                  <div>{boolToYesNo(play.unusedClues.length === 0)}</div>
                  {play.unusedClues.length !== 0 && (
                    <ul>
                      {play.unusedClues.map((clue) => (
                        <li>{clue}</li>
                      ))}
                    </ul>
                  )}
                </td>
              ))}
            </tr>
          )}
          {!first && (
            <tr>
              <th scope="row">Valid for 'hard mode'?</th>
              {plays.map((play) => (
                <td>{boolToYesNo(play.validForHardMode)}</td>
              ))}
            </tr>
          )}
          <tr>
            <th scope="row">Common word?</th>
            {plays.map((play) => (
              <td>{boolToYesNo(play.commonWord)}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">Average eliminations</th>
            {plays.map((play) => (
              <td>
                {play.averageRemaining
                  ? toTwoDecimalPlaces(
                      (1 - play.averageRemaining.all / totalRemaining) * 100,
                    ) +
                    '%' +
                    ` (leaving ${toTwoDecimalPlaces(
                      play.averageRemaining.all,
                    )})`
                  : 'Word not found'}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">Actual eliminations</th>
            {plays.map((play) => (
              <td>
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
              </td>
            ))}
          </tr>
        </table>

        {userRemainingAnswers.common.length +
          userRemainingAnswers.other.length <
          30 && (
          <ul class={styles.remainingList}>
            {[
              ...userRemainingAnswers.common,
              ...userRemainingAnswers.other,
            ].map((remaining) => (
              <li class={guessStyles.small}>
                <Guess value={remaining} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}
