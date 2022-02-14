import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import * as utilStyles from '../../../utils.module.css';
import 'add-css:./styles.module.css';
import {
  aiPlay,
  analyzeGuess,
  getGuessesColors,
  getInvalidWords,
} from './analyzer';
import {
  AIPlay,
  CellColors,
  Clue,
  GuessAnalysis,
  RemainingAnswers,
} from 'shared-types/index';
import Guess from '../../Guess';
import PreCommentary from './PreCommentary';
import PlayerAnalysisTable from './PlayerAnalysisTable';
import Progress from './Progress';
import Actions from './Actions';
import PostCommentary from './PostCommentary';
import AIAnalysisTable from './AIAnalysisTable';
import {
  filterRemainingItemsForMaxDisplay,
  formatNumber,
  RemainingItemsType,
} from '../utils';
import RemainingList from './RemainingList';

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
  analysisError: string | undefined;
  analysisComplete: boolean;
}

const defaultState: State = {
  analysis: [],
  aiPlays: [],
  guessCellColors: undefined,
  analysisError: undefined,
  analysisComplete: false,
};

export default class Analysis extends Component<Props, State> {
  state: Readonly<State> = {
    ...defaultState,
  };

  constructor(props: Props) {
    super(props);
    this.#analyze();
  }

  componentDidUpdate(previousProps: Props) {
    if (
      previousProps.answer !== this.props.answer ||
      previousProps.guesses.length !== this.props.guesses.length ||
      previousProps.guesses.some((guess, i) => guess !== this.props.guesses[i])
    ) {
      this.#analyze();
    }
  }

  componentWillUnmount() {
    if (this.#abortController) this.#abortController.abort();
  }

  #abortController: AbortController | undefined = undefined;

  async #analyze() {
    if (this.#abortController) this.#abortController.abort();

    this.#abortController = new AbortController();
    const signal = this.#abortController.signal;

    try {
      this.setState((state) => ({
        ...defaultState,
      }));

      this.setState({
        guessCellColors: await getGuessesColors(
          signal,
          this.props.answer,
          this.props.guesses,
        ),
      });

      const invalidAnswers = await getInvalidWords(signal, this.props.guesses);

      if (invalidAnswers.length !== 0) {
        this.setState({
          analysisError: `Uh oh, one or more of those words isn't in the dictionary: ${invalidAnswers
            .map((word) => `"${word}"`)
            .join(', ')}`,
        });

        return;
      }

      {
        const previousClues: Clue[] = [];
        let remainingAnswers: RemainingAnswers | undefined = undefined;

        for (const [i, guess] of this.props.guesses.entries()) {
          this.setState((state) => {
            const analysis = state.analysis.slice();
            analysis[i] = 0;
            return { analysis };
          });

          const result: GuessAnalysis = await analyzeGuess(
            signal,
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
          this.setState((state) => {
            const aiPlays = state.aiPlays.slice();
            aiPlays[guess] = 0;
            return { aiPlays };
          });

          const result: AIPlay = await aiPlay(
            signal,
            this.props.answer,
            previousClues,
            {
              remainingAnswers,
              onProgress: (done, expecting) => {
                this.setState((state) => {
                  const aiPlays = state.aiPlays.slice();
                  aiPlays[guess] = done / expecting;
                  return { aiPlays };
                });
              },
            },
          );

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

      this.setState((state) => ({
        analysisComplete: true,
      }));
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      throw err;
    }
  }

  render(
    { guesses, answer }: RenderableProps<Props>,
    {
      analysis,
      aiPlays,
      guessCellColors,
      analysisError,
      analysisComplete,
    }: State,
  ) {
    return (
      <div>
        <div class={utilStyles.container}>
          {guessCellColors && (
            <>
              <div class={styles.guesses}>
                {guesses.map((guess, i) => (
                  <a
                    class={utilStyles.hiddenLink}
                    target="_blank"
                    href={`https://en.wiktionary.org/wiki/${guess}`}
                  >
                    <Guess value={guess} cellClues={guessCellColors[i]} />
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
        {guessCellColors && (
          <Actions
            cellColors={guessCellColors}
            foundAnswer={guesses[guesses.length - 1] === answer}
          />
        )}
        {analysisError && (
          <div class={utilStyles.container}>
            <p class={styles.commentary}>{analysisError}</p>
          </div>
        )}
        {analysis.map((guessAnalysis, i, allGuessAnalysis) => (
          <>
            <h2 class={styles.pillHeading}>Guess {i + 1}</h2>
            {typeof guessAnalysis === 'number' ? (
              <div class={styles.progressContainer}>
                <Progress value={guessAnalysis} />
              </div>
            ) : (
              <>
                <div class={utilStyles.container}>
                  <div class={styles.commentary}>
                    <PreCommentary
                      guessAnalysis={guessAnalysis}
                      turn={i}
                      remainingAnswers={
                        i > 0
                          ? (allGuessAnalysis[i - 1] as GuessAnalysis).plays
                              .user.remainingAnswers
                          : undefined
                      }
                    />
                  </div>
                </div>
                <PlayerAnalysisTable
                  guessAnalysis={guessAnalysis}
                  first={i === 0}
                  answer={answer}
                />
                <div class={utilStyles.container}>
                  <div class={styles.commentary}>
                    <PostCommentary
                      guessAnalysis={guessAnalysis}
                      turn={i}
                      answer={answer}
                      beforeRemainingAnswers={
                        i > 0
                          ? (allGuessAnalysis[i - 1] as GuessAnalysis).plays
                              .user.remainingAnswers
                          : undefined
                      }
                    />
                  </div>
                </div>
              </>
            )}
          </>
        ))}
        {aiPlays.length !== 0 && (
          <div class={utilStyles.container}>
            <h2 class={styles.pillHeading}>AI playthrough</h2>

            <div class={styles.guesses}>
              {aiPlays.map((aiPlay, i) =>
                typeof aiPlay === 'number' ? (
                  <div class={styles.progressContainer}>
                    <Progress value={aiPlay} />
                  </div>
                ) : (
                  <a
                    class={utilStyles.hiddenLink}
                    target="_blank"
                    href={`https://en.wiktionary.org/wiki/${aiPlay.play.guess}`}
                  >
                    <Guess
                      value={aiPlay.play.guess}
                      cellClues={aiPlay.play.colors}
                    />
                  </a>
                ),
              )}
            </div>
          </div>
        )}
        {analysisComplete &&
          aiPlays.map((aiPlay, i, allAiPlays) => {
            if (typeof aiPlay === 'number') return;

            const remainingCount =
              aiPlay.beforeRemainingCounts.common +
              aiPlay.beforeRemainingCounts.other;
            const remainingDisplay =
              i > 0
                ? filterRemainingItemsForMaxDisplay(
                    (allAiPlays[i - 1] as AIPlay).play.remainingAnswers,
                  )
                : undefined;

            return (
              <>
                <div class={utilStyles.container}>
                  <h2 class={styles.pillHeading}>AI Guess {i + 1}</h2>
                  <p class={styles.commentary}>
                    <strong>
                      {formatNumber(remainingCount)}{' '}
                      {remainingCount === 1 ? 'word' : 'words'} remaining,{' '}
                      {formatNumber(aiPlay.beforeRemainingCounts.common)} common
                    </strong>
                    .{' '}
                    {remainingDisplay &&
                      (remainingDisplay.remainingType ===
                      RemainingItemsType.CommonOnly
                        ? aiPlay.beforeRemainingCounts.common === 1
                          ? 'The common one is:'
                          : 'The common ones are:'
                        : remainingCount > 1 && 'They are:')}
                  </p>
                  {remainingDisplay && (
                    <RemainingList
                      remainingToDisplay={remainingDisplay.remaining}
                    />
                  )}
                  <AIAnalysisTable
                    answer={answer}
                    first={i === 0}
                    beforeRemainingCounts={aiPlay.beforeRemainingCounts}
                    play={aiPlay.play}
                    strategy={aiPlay.strategy}
                  />
                </div>
              </>
            );
          })}
        {analysisComplete && (
          <Actions
            cellColors={guessCellColors!}
            foundAnswer={guesses[guesses.length - 1] === answer}
          />
        )}
      </div>
    );
  }
}
