import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import * as utilStyles from '../../../utils.module.css';
import * as guessStyles from '../../Guess/styles.module.css';
import {
  GuessAnalysis,
  PlayAnalysis,
  RemainingAnswers,
} from 'shared-types/index';
import Guess from 'client/App/Guess';

interface Props {
  first: boolean;
  answer: string;
  guessAnalysis: GuessAnalysis;
}

interface State {}

const wordStr = ['word', 'words'];
const boolToYesNo = (bool: boolean) => (bool ? '✅' : '❌');
const toTwoDecimalPlaces = (num: number) => Math.round(num * 100) / 100;

// Undefined return means they're equal.
function getBestPlay(
  answer: string,
  plays: readonly [PlayAnalysis, PlayAnalysis],
): PlayAnalysis | undefined {
  if (plays.every((p) => p.guess === answer)) return undefined;

  const correctGuessingPlay = plays.find((p) => p.guess === answer);
  if (correctGuessingPlay) return correctGuessingPlay;

  // The best is the one that eliminates the most common words,
  // with other words as a tie-breaker.
  for (const type of ['common', 'other'] as const) {
    if (
      plays[0].remainingAnswers[type].length !==
      plays[1].remainingAnswers[type].length
    ) {
      return plays[0].remainingAnswers[type].length <
        plays[1].remainingAnswers[type].length
        ? plays[0]
        : plays[1];
    }
  }

  return undefined;
}

export default class AnalysisEntry extends Component<Props, State> {
  render({ guessAnalysis, first, answer }: RenderableProps<Props>) {
    const initalRemaining =
      guessAnalysis.beforeRemainingCounts.common +
      guessAnalysis.beforeRemainingCounts.other;
    const plays = [guessAnalysis.plays.user, guessAnalysis.plays.ai] as const;
    const bothGuessesRight = plays.every((play) => play.guess === answer);
    const bestPlay = getBestPlay(answer, plays);

    return (
      <div class={styles.analysisEntry}>
        <table class={styles.analysisTable}>
          <tr>
            <td></td>
            <th scope="col">Played</th>
            <th scope="col">AI would have played</th>
          </tr>
          <tr>
            <th scope="row">Guess</th>
            {plays.map((play) => (
              <td class={guessStyles.small}>
                <a
                  class={utilStyles.hiddenLink}
                  target="_blank"
                  href={`https://en.wiktionary.org/wiki/${play.guess}`}
                >
                  <Guess value={play.guess} cellClues={play.colors} />
                </a>
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
                    <ul class={styles.unusedClueList}>
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
                <td>
                  <div>{boolToYesNo(play.hardModeViolations.length === 0)}</div>
                  {play.hardModeViolations.length !== 0 && (
                    <ul class={styles.unusedClueList}>
                      {play.hardModeViolations.map((violation) => (
                        <li>{violation}</li>
                      ))}
                    </ul>
                  )}
                </td>
              ))}
            </tr>
          )}
          <tr>
            <th scope="row">Common word?</th>
            {plays.map((play) => (
              <td>{boolToYesNo(play.commonWord)}</td>
            ))}
          </tr>
          {initalRemaining > 2 && (
            <tr>
              <th scope="row">Average remaining words</th>
              {plays.map((play) => (
                <td>
                  {play.averageRemaining ? (
                    <>
                      {toTwoDecimalPlaces(play.averageRemaining.all)}{' '}
                      {play.averageRemaining.all === 1
                        ? wordStr[0]
                        : wordStr[1]}
                      ,{' '}
                      <span class={styles.noBreak}>
                        {toTwoDecimalPlaces(play.averageRemaining.common)}{' '}
                        common
                      </span>
                    </>
                  ) : (
                    'Word not found'
                  )}
                </td>
              ))}
            </tr>
          )}
          <tr>
            <th scope="row">Actual remaining words</th>
            {plays.map((play, i) => (
              <td class={!bestPlay || bestPlay === play ? styles.cellWin : ''}>
                {play.guess === answer ? (
                  'Correct!'
                ) : (
                  <>
                    {play.remainingAnswers.common.length +
                      play.remainingAnswers.other.length}{' '}
                    {play.remainingAnswers.common.length +
                      play.remainingAnswers.other.length ===
                    1
                      ? wordStr[0]
                      : wordStr[1]}
                    ,{' '}
                    <span class={styles.noBreak}>
                      {play.remainingAnswers.common.length} common
                    </span>
                  </>
                )}
              </td>
            ))}
          </tr>
        </table>
      </div>
    );
  }
}
