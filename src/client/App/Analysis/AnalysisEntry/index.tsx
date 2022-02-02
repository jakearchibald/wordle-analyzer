import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import * as guessStyles from '../../Guess/styles.module.css';
import { GuessAnalysis, RemainingAnswers } from 'shared-types/index';
import Guess from 'client/App/Guess';

export interface GuessAnalysisWithRemainingAnswers extends GuessAnalysis {
  beforeRemainingAnswers?: RemainingAnswers;
}

interface Props {
  first: boolean;
  guessAnalysis: GuessAnalysisWithRemainingAnswers;
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

    return (
      <div class={styles.analysisEntry}>
        <h2>
          {totalRemaining} remaining{' '}
          {totalRemaining === 1 ? 'possibility' : 'possibilities'} (
          {guessAnalysis.beforeRemainingCounts.common} 'common'{' '}
          {guessAnalysis.beforeRemainingCounts.common === 1 ? 'word' : 'words'})
        </h2>
        {guessAnalysis.beforeRemainingAnswers && totalRemaining < 30 && (
          <ul class={styles.remainingList}>
            {[
              ...guessAnalysis.beforeRemainingAnswers.common,
              ...guessAnalysis.beforeRemainingAnswers.other,
            ].map((remaining) => (
              <li class={guessStyles.small}>
                <Guess value={remaining} />
              </li>
            ))}
          </ul>
        )}
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
      </div>
    );
  }
}
