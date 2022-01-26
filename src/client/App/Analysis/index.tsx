import { h, Component, RenderableProps } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';

interface GuessData {
  guess: string;
  // TODO: change to correct type
  guessColors: string[];
  inDictionary: boolean;
  averageEliminations: number;
  remainingAnswers: string[];
}

interface AnalysisData {
  possibleAnswers: string[];
  guess: GuessData;
  aiGuess: GuessData;
}

interface Props {
  guesses: string[];
  answer: string;
  /** Number is 0-1 representing progress */
  analysis: (AnalysisData | number)[];
  /** Number is 0-1 representing progress */
  aiPlay: (GuessData | number)[];
}

interface State {
  guesses: string[];
  answer: string;

  /** 0-1 depending on loading state */
  analysisProgresses: number[];
}

export default class Analysis extends Component<Props, State> {
  render({}: RenderableProps<Props>) {
    return <div class={styles.analysis}>…</div>;
  }
}
