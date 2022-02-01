import { h, Fragment, Component, RenderableProps } from 'preact';
import Guesses from './Guesses';
import MainInstruction from 'shared/MainInstruction';
import * as styles from './styles.module.css';
import Analysis from './Analysis';
import 'add-css:./styles.module.css';
import 'add-css:../utils.module.css';

interface Props {}

interface State {
  guessInputs: string[];
  toAnalyze?: { guesses: string[]; answer: string };
}

export default class App extends Component<Props, State> {
  state: State = {
    guessInputs: Array.from({ length: 7 }, () => ''),
    toAnalyze: { guesses: ['roate', 'stole', 'those'], answer: 'those' },
  };

  #onGuessesInput = (guesses: string[]) => {
    this.setState({ guessInputs: guesses });
  };

  #onGuessesSubmit = (guesses: string[]) => {
    // TODO: replace this with history API stuff
    this.setState({ toAnalyze: { guesses, answer: guesses.slice(-1)[0] } });
  };

  render(_: RenderableProps<Props>, { guessInputs, toAnalyze }: State) {
    return (
      <>
        <MainInstruction active={toAnalyze ? 'results' : 'enter-words'} />
        {toAnalyze ? (
          <Analysis answer={toAnalyze.answer} guesses={toAnalyze.guesses} />
        ) : (
          <Guesses
            values={guessInputs}
            onInput={this.#onGuessesInput}
            onSubmit={this.#onGuessesSubmit}
          />
        )}
      </>
    );
  }
}
