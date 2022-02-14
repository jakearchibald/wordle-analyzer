import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import * as utilStyles from '../../../../utils.module.css';
import * as guessStyles from '../../../Guess/styles.module.css';
import {
  AIStrategy,
  GuessAnalysis,
  Luck,
  PlayAnalysis,
} from 'shared-types/index';
import Guess from 'client/App/Guess';
import { formatNumber } from '../../utils';

interface Props {
  first: boolean;
  answer: string;
  plays: PlayAnalysis[];
  bestPlay?: PlayAnalysis | undefined;
  beforeRemainingCounts: GuessAnalysis['beforeRemainingCounts'];
  strategies?: AIStrategy[];
}

interface State {}

const wordStr = ['word', 'words'];
const boolToYesNo = (bool: boolean) => (bool ? '✅' : '❌');

function getLuck({ good, chance }: Luck): string {
  if (chance > 1 / 2) return 'Neutral';

  if (good) {
    if (chance > 1 / 5) return `Lucky`;
    if (chance > 1 / 10) return `Very lucky`;
    if (chance > 1 / 50) return `Super lucky`;
    if (chance > 1 / 100) return `Extremely lucky`;
    if (chance > 1 / 1000) return `Unbelievably lucky`;
    return `WTF HOW??`;
  }
  if (chance > 1 / 5) return `Unlucky`;
  if (chance > 1 / 10) return `Very unlucky`;
  if (chance > 1 / 50) return `Super unlucky`;
  if (chance > 1 / 100) return `Extremely unlucky`;
  if (chance > 1 / 1000) return `Unbelievably unlucky`;
  return `Oh god I'm so sorry`;
}

function getStrategyDescription(strategy: AIStrategy): string {
  switch (strategy) {
    case AIStrategy.EliminateCommon:
      return 'Eliminate common words';
    case AIStrategy.EliminateCommonWithAnswer:
      return 'Eliminate common words with possible answer';
    case AIStrategy.Play5050Common:
      return 'Take a punt on a common word';
    case AIStrategy.PlaySingleCommon:
      return 'Play remaining common word';
    case AIStrategy.EliminateUncommon:
      return 'Eliminate uncommon words';
    case AIStrategy.EliminateUncommonWithAnswer:
      return 'Eliminate uncommon words with possible answer';
    case AIStrategy.Play5050Uncommon:
      return 'Take a punt on a remaining word';
    case AIStrategy.PlaySingleUncommon:
      return 'Play remaining word';
  }
}

export default class AnalysisRows extends Component<Props, State> {
  render({
    beforeRemainingCounts,
    first,
    answer,
    plays,
    bestPlay,
    strategies,
  }: RenderableProps<Props>) {
    const initalRemaining =
      beforeRemainingCounts.common + beforeRemainingCounts.other;
    const allGuessesRight = plays.every((play) => play.guess === answer);

    return (
      <>
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
        {strategies && (
          <tr>
            <th scope="row">Strategy</th>
            {strategies.map((strategy) => (
              <td>{getStrategyDescription(strategy)}</td>
            ))}
          </tr>
        )}
        {initalRemaining > 2 && (
          <tr>
            <th scope="row">Average remaining words</th>
            {plays.map((play) => (
              <td>
                {play.averageRemaining ? (
                  <>
                    {formatNumber(play.averageRemaining.all)}{' '}
                    {play.averageRemaining.all === 1 ? wordStr[0] : wordStr[1]},{' '}
                    <span class={styles.noBreak}>
                      {formatNumber(play.averageRemaining.common)} common
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
          <th scope="row">Guess quality</th>
          {plays.map((play) => (
            <td>{formatNumber(play.guessQuality * 100)}%</td>
          ))}
        </tr>
        {initalRemaining > 1 && !allGuessesRight && (
          <tr>
            <th scope="row">Actual remaining words</th>
            {plays.map((play) => (
              <td
                class={
                  plays.length !== 1 && (!bestPlay || bestPlay === play)
                    ? styles.cellWin
                    : ''
                }
              >
                {play.guess === answer ? (
                  'Correct!'
                ) : (
                  <>
                    {formatNumber(
                      play.remainingAnswers.common.length +
                        play.remainingAnswers.other.length,
                    )}{' '}
                    {play.remainingAnswers.common.length +
                      play.remainingAnswers.other.length ===
                    1
                      ? wordStr[0]
                      : wordStr[1]}
                    ,{' '}
                    <span class={styles.noBreak}>
                      {formatNumber(play.remainingAnswers.common.length)} common
                    </span>
                  </>
                )}
              </td>
            ))}
          </tr>
        )}
        {initalRemaining > 1 && (
          <tr>
            <th scope="row">Luck rating</th>

            {plays.map((play) => (
              <td>{getLuck(play.luck)}</td>
            ))}
          </tr>
        )}
        {!first && !allGuessesRight && (
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
        {!first && !allGuessesRight && (
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
      </>
    );
  }
}
