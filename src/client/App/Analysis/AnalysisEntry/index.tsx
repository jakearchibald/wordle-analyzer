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
  answer: string;
  guessAnalysis: GuessAnalysisWithRemainingAnswers;
}

interface State {}

const boolToYesNo = (bool: boolean) => (bool ? '✅' : '❌');
const toTwoDecimalPlaces = (num: number) => Math.round(num * 100) / 100;

export default class AnalysisEntry extends Component<Props, State> {
  render({ guessAnalysis, first, answer }: RenderableProps<Props>) {
    const plays = [guessAnalysis.plays.user, guessAnalysis.plays.ai];
    const totalRemaining =
      guessAnalysis.beforeRemainingCounts.common +
      guessAnalysis.beforeRemainingCounts.other;

    const bothGuessesRight = plays.every((play) => play.guess === answer);

    return (
      <div class={styles.analysisEntry}>
        <p class={styles.remainingDescription}>
          {totalRemaining} remaining{' '}
          {totalRemaining === 1 ? 'answer' : 'answers'} (
          {guessAnalysis.beforeRemainingCounts.common} 'common'{' '}
          {guessAnalysis.beforeRemainingCounts.common === 1 ? 'word' : 'words'}
          ).
        </p>
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
        <table class={styles.analysisTable}>
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
          {!first && !bothGuessesRight && (
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
          {!first && !bothGuessesRight && (
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
                {play.averageRemaining ? (
                  <>
                    {toTwoDecimalPlaces(
                      (1 - play.averageRemaining.all / totalRemaining) * 100,
                    )}
                    %{' '}
                    <span class={styles.noBreak}>
                      (leaving {toTwoDecimalPlaces(play.averageRemaining.all)})
                    </span>
                  </>
                ) : (
                  'Word not found'
                )}
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
                )}
                %{' '}
                <span class={styles.noBreak}>
                  (leaving{' '}
                  {play.remainingAnswers.common.length +
                    play.remainingAnswers.other.length}
                  )
                </span>
              </td>
            ))}
          </tr>
        </table>
      </div>
    );
  }
}
