import { h, Fragment, Component, RenderableProps } from 'preact';
import EditableGuesses from './EditableGuesses';
import MainInstruction from 'shared/MainInstruction';
import * as styles from './styles.module.css';
import Analysis from './Analysis';
import 'add-css:./styles.module.css';
import 'add-css:../utils.module.css';
import { encode, decode } from './stupid-simple-cypher';

interface Props {}

interface State {
  guessInputs: string[];
  toAnalyze?: { guesses: string[]; answer: string };
}

export default class App extends Component<Props, State> {
  state: State = {
    guessInputs: Array.from({ length: 7 }, () => ''),
    /*toAnalyze: {
      guesses: ['smart', 'roate'],
      answer: 'roate',
    },*/
  };

  componentDidMount() {
    this.#setStateFromUrl();
    addEventListener('popstate', () => this.#setStateFromUrl());
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return (
      nextState.guessInputs !== this.state.guessInputs ||
      nextState.toAnalyze !== this.state.toAnalyze
    );
  }

  #setStateFromUrl() {
    const urlParams = new URLSearchParams(location.search);

    if (!urlParams.has('guesses')) {
      this.setState({
        toAnalyze: undefined,
      });
      return;
    }

    const seed = Number(urlParams.get('seed'));
    const guesses = urlParams.get('guesses')!;

    if (Number.isNaN(seed) || !/^[a-z]+$/.test(guesses) || guesses.length % 5) {
      this.setState({
        toAnalyze: undefined,
      });
      return;
    }

    const decoded = decode(seed, guesses);
    const guessesArray = Array.from({ length: decoded.length / 5 }, (_, i) =>
      decoded.slice(i * 5, i * 5 + 5),
    );

    this.setState({
      toAnalyze: {
        guesses: guessesArray,
        answer: guessesArray.slice(-1)[0],
      },
    });
  }

  #onGuessesInput = (guesses: string[]) => {
    this.setState({ guessInputs: guesses });
  };

  #onGuessesSubmit = (guesses: string[]) => {
    const seed = Math.floor(Math.random() * 1000);
    const joinedAnswers = guesses.join('');
    const encoded = encode(seed, joinedAnswers);
    const url = new URL('./', location.href);
    url.searchParams.set('seed', seed.toString());
    url.searchParams.set('guesses', encoded);

    history.pushState(null, '', url);
    this.#setStateFromUrl();
  };

  render(_: RenderableProps<Props>, { guessInputs, toAnalyze }: State) {
    return (
      <>
        <MainInstruction active={toAnalyze ? 'results' : 'enter-words'} />
        {toAnalyze ? (
          <Analysis answer={toAnalyze.answer} guesses={toAnalyze.guesses} />
        ) : (
          <EditableGuesses
            values={guessInputs}
            onInput={this.#onGuessesInput}
            onSubmit={this.#onGuessesSubmit}
          />
        )}
      </>
    );
  }
}
