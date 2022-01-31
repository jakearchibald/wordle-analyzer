import { h, Component, RenderableProps } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';

interface GuessData {}

interface AnalysisData {}

interface Props {
  guesses: string[];
  answer: string;
}

interface State {
  guesses: string[];
  answer: string;

  /** Number is 0-1 representing progress */
  analysis: (AnalysisData | number)[];
  /** Number is 0-1 representing progress */
  aiPlay: (GuessData | number)[];
}

export default class Analysis extends Component<Props, State> {
  render({}: RenderableProps<Props>) {
    return <div class={styles.analysis}>hello there</div>;
  }
}
