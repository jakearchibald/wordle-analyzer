import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import * as rowStyles from '../AnalysisRows/styles.module.css';
import { AIStrategy, GuessAnalysis, PlayAnalysis } from 'shared-types/index';
import AnalysisRows from '../AnalysisRows';

interface Props {
  first: boolean;
  answer: string;
  beforeRemainingCounts: GuessAnalysis['beforeRemainingCounts'];
  play: PlayAnalysis;
  strategy: AIStrategy;
}

interface State {}

export default class AIAnalysisTable extends Component<Props, State> {
  render({
    beforeRemainingCounts,
    play,
    first,
    answer,
    strategy,
  }: RenderableProps<Props>) {
    return (
      <div>
        <table
          class={[rowStyles.analysisTable, styles.aiAnalysisTable].join(' ')}
        >
          <tr>
            <td></td>
            <th scope="col">Played</th>
          </tr>
          <AnalysisRows
            answer={answer}
            beforeRemainingCounts={beforeRemainingCounts}
            first={first}
            plays={[play]}
            strategies={[strategy]}
          />
        </table>
      </div>
    );
  }
}
