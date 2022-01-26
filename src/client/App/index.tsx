import { h, Fragment, Component, RenderableProps } from 'preact';
import Guesses from './Guesses';
import Header from './Header';
import MainInstruction from './MainInstruction';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';

interface Props {}

interface State {
  guessInputs: string[];
  toAnalyze?: { guesses: string[]; answer: string };
}

export default class App extends Component<Props, State> {
  state: State = {
    guessInputs: Array.from({ length: 7 }, () => ''),
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
        <Header />
        <MainInstruction active={toAnalyze ? 'results' : 'enter-words'} />
        <Guesses
          values={guessInputs}
          onInput={this.#onGuessesInput}
          onSubmit={this.#onGuessesSubmit}
        />
      </>
    );
  }
}
