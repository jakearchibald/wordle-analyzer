import { h, Component, RenderableProps } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import { analyzeGuess } from './analyzer';
import {
  AIPlay,
  Clue,
  GuessAnalysis,
  RemainingAnswers,
} from 'shared-types/index';
import AnalysisEntry from './AnalysisEntry';

interface Props {
  guesses: string[];
  answer: string;
}

interface State {
  /** Number is 0-1 representing progress */
  analysis: (GuessAnalysis | number)[];
  /** Number is 0-1 representing progress */
  aiPlay: (AIPlay | number)[];
}

export default class Analysis extends Component<Props, State> {
  state: Readonly<State> = {
    analysis: [],
    aiPlay: [],
  };

  constructor(props: Props) {
    super(props);
    this.#analyze();
  }

  componentDidUpdate(previousProps: Props) {
    if (
      previousProps.guesses !== this.props.guesses ||
      previousProps.answer !== this.props.answer
    ) {
      this.#analyze();
    }
  }

  async #analyze() {
    this.setState({
      analysis: [],
      aiPlay: [],
    });

    const previousClues: Clue[] = [];
    let remainingAnswers: RemainingAnswers | undefined = undefined;

    for (const [i, guess] of this.props.guesses.entries()) {
      const result: GuessAnalysis = await analyzeGuess(
        guess,
        this.props.answer,
        previousClues,
        {
          remainingAnswers,
          onProgress: (done, expecting) => {
            this.setState((state) => {
              const analysis = state.analysis.slice();
              analysis[i] = done / expecting;
              return { analysis };
            });
          },
        },
      );

      this.setState((state) => {
        const analysis = state.analysis.slice();
        analysis[i] = result;
        return { analysis };
      });

      previousClues.push(result.plays.user.clue);
      remainingAnswers = result.plays.user.remainingAnswers;
    }
  }

  render({}: RenderableProps<Props>, { analysis, aiPlay }: State) {
    return (
      <div class={styles.analysis}>
        {analysis.map((guessAnalysis, i) =>
          typeof guessAnalysis === 'number' ? (
            <progress value={guessAnalysis} />
          ) : (
            <AnalysisEntry guessAnalysis={guessAnalysis} first={i === 0} />
          ),
        )}
      </div>
    );
  }
}
