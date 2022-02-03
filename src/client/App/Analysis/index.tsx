import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import { aiPlay, analyzeGuess, getGuessesColors } from './analyzer';
import {
  AIPlay,
  CellColors,
  Clue,
  GuessAnalysis,
  RemainingAnswers,
} from 'shared-types/index';
import AnalysisEntry, {
  GuessAnalysisWithRemainingAnswers,
} from './AnalysisEntry';
import Guess from '../Guess';

interface AiPlayWithRemainingAnswers extends AIPlay {
  beforeRemainingAnswers?: RemainingAnswers;
}

interface Props {
  guesses: string[];
  answer: string;
}

interface State {
  /** Number is 0-1 representing progress */
  analysis: (GuessAnalysisWithRemainingAnswers | number)[];
  /** Number is 0-1 representing progress */
  aiPlays: (AiPlayWithRemainingAnswers | number)[];
  guessCellColors: CellColors[] | undefined;
}

export default class Analysis extends Component<Props, State> {
  state: Readonly<State> = {
    analysis: [],
    aiPlays: [],
    guessCellColors: undefined,
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
      aiPlays: [],
      guessCellColors: undefined,
    });

    this.setState({
      guessCellColors: await getGuessesColors(
        this.props.answer,
        this.props.guesses,
      ),
    });

    {
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
          analysis[i] = { ...result, beforeRemainingAnswers: remainingAnswers };
          return { analysis };
        });

        previousClues.push(result.plays.user.clue);
        remainingAnswers = result.plays.user.remainingAnswers;
      }
    }

    {
      const previousClues: Clue[] = [];
      let remainingAnswers: RemainingAnswers | undefined = undefined;

      for (let guess = 0; ; guess++) {
        const result: AIPlay = await aiPlay(this.props.answer, previousClues, {
          remainingAnswers,
          onProgress: (done, expecting) => {
            this.setState((state) => {
              const aiPlays = state.aiPlays.slice();
              aiPlays[guess] = done / expecting;
              return { aiPlays };
            });
          },
        });

        this.setState((state) => {
          const aiPlays = state.aiPlays.slice();
          aiPlays[guess] = {
            ...result,
            beforeRemainingAnswers: remainingAnswers,
          };
          return { aiPlays };
        });

        if (result.play.guess === this.props.answer) break;

        previousClues.push(result.play.clue);
        remainingAnswers = result.play.remainingAnswers;
      }
    }
  }

  render(
    { guesses, answer }: RenderableProps<Props>,
    { analysis, aiPlays, guessCellColors }: State,
  ) {
    return (
      <div class={styles.analysis}>
        {guessCellColors && (
          <div class={styles.guesses}>
            {guesses.map((guess, i) => (
              <Guess value={guess} cellClues={guessCellColors[i]} />
            ))}
          </div>
        )}
        {analysis.map((guessAnalysis, i) => (
          <div>
            <h2 class={styles.guessHeading}>Guess {i + 1}</h2>
            {typeof guessAnalysis === 'number' ? (
              <progress value={guessAnalysis} />
            ) : (
              <AnalysisEntry
                guessAnalysis={guessAnalysis}
                first={i === 0}
                answer={answer}
              />
            )}
          </div>
        ))}
        {aiPlays.map((aiPlay, i) => (
          <div>
            {typeof aiPlay !== 'number' && (
              <>
                {aiPlay.play.guess} -{' '}
                {aiPlay.play.unusedClues.length === 0 && 'possible answer'}
              </>
            )}
          </div>
        ))}
      </div>
    );
  }
}
