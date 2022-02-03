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
import Guess from '../Guess';
import PreCommentary from './PreCommentary';
import AnalysisEntry from './AnalysisEntry';
import Progress from './Progress';

interface Props {
  guesses: string[];
  answer: string;
}

interface State {
  /** Number is 0-1 representing progress */
  analysis: (GuessAnalysis | number)[];
  /** Number is 0-1 representing progress */
  aiPlays: (AIPlay | number)[];
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
          analysis[i] = { ...result };
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
          aiPlays[guess] = { ...result };
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
        {analysis.map((guessAnalysis, i, allGuessAnalysis) => (
          <div>
            <h2 class={styles.pillHeading}>Guess {i + 1}</h2>
            {typeof guessAnalysis === 'number' ? (
              <div class={styles.progressContainer}>
                <Progress value={guessAnalysis} />
              </div>
            ) : (
              <>
                <div class={styles.preCommentary}>
                  <PreCommentary
                    guessAnalysis={guessAnalysis}
                    turn={i}
                    remainingAnswers={
                      i > 0
                        ? (allGuessAnalysis[i - 1] as GuessAnalysis).plays.user
                            .remainingAnswers
                        : undefined
                    }
                  />
                </div>
                <AnalysisEntry
                  guessAnalysis={guessAnalysis}
                  first={i === 0}
                  answer={answer}
                />
              </>
            )}
          </div>
        ))}
        {aiPlays.length !== 0 && (
          <>
            <h2 class={styles.pillHeading}>AI playthrough</h2>

            <p>
              The AI mostly tries to eliminate as many answers as possible with
              each guess, although as there are fewer options left, although if
              there's a possible answer that's almost as good, it'll play that.
            </p>

            <div class={styles.guesses}>
              {aiPlays.map((aiPlay, i) =>
                typeof aiPlay === 'number' ? (
                  <div class={styles.progressContainer}>
                    <Progress value={aiPlay} />
                  </div>
                ) : (
                  <Guess
                    value={aiPlay.play.guess}
                    cellClues={aiPlay.play.colors}
                  />
                ),
              )}
            </div>
          </>
        )}
      </div>
    );
  }
}
