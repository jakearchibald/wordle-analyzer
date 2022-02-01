import { h, Component, RenderableProps } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import { GuessAnalysis } from 'shared-types/index';

interface Props {
  guessAnalysis: GuessAnalysis;
}

interface State {}

export default class AnalysisEntry extends Component<Props, State> {
  render({ guessAnalysis }: RenderableProps<Props>) {
    return (
      <div class={styles.analysisEntry}>{guessAnalysis.plays.user.guess}</div>
    );
  }
}
