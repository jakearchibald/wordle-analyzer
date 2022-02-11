import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import * as rowStyles from '../AnalysisRows/styles.module.css';
import { GuessAnalysis } from 'shared-types/index';
import AnalysisRows from '../AnalysisRows';

interface Props {
  first: boolean;
  answer: string;
  guessAnalysis: GuessAnalysis;
}

interface State {}

export default class PlayerAnalysisTable extends Component<Props, State> {
  render({ guessAnalysis, first, answer }: RenderableProps<Props>) {
    return (
      <div>
        <table
          class={[rowStyles.analysisTable, styles.playerAnalysisTable].join(
            ' ',
          )}
        >
          <tr>
            <td></td>
            <th scope="col">Played</th>
            <th scope="col">AI would have played</th>
          </tr>
          <AnalysisRows
            answer={answer}
            beforeRemainingCounts={guessAnalysis.beforeRemainingCounts}
            first={first}
            plays={[guessAnalysis.plays.user, guessAnalysis.plays.ai]}
            bestPlay={guessAnalysis.plays.bestPlay}
          />
        </table>
      </div>
    );
  }
}
