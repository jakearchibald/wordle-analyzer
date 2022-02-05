import { h, Fragment, Component, RenderableProps } from 'preact';
import EditableGuesses from './EditableGuesses';
import MainInstruction from './MainInstruction';
import Analysis from './Analysis';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import 'add-css:../utils.module.css';
import { encode, decode } from './stupid-simple-cypher';
import SpoilerWarning from './SpoilerWarning';

interface Props {}

interface State {
  showSpoilerWarning: boolean;
  guessInputs: string[];
  toAnalyze?: { guesses: string[]; answer: string };
}

export default class App extends Component<Props, State> {
  state: State = {
    showSpoilerWarning: false,
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

    if (
      Number.isNaN(seed) ||
      !/^[a-z]+$/.test(guesses) ||
      guesses.length % 5 ||
      guesses.length / 5 > 7
    ) {
      this.setState({
        toAnalyze: undefined,
      });
      return;
    }

    if (sessionStorage.skipNextSpoilerWarning) {
      sessionStorage.skipNextSpoilerWarning = '';
      history.replaceState({ ...history.state, skipSpoilerWarning: true }, '');
    }

    if (!history.state?.skipSpoilerWarning) {
      this.setState({
        showSpoilerWarning: true,
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
      showSpoilerWarning: false,
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

    history.pushState({ skipSpoilerWarning: true }, '', url);
    this.#setStateFromUrl();
  };

  #onSpoilerClear = () => {
    history.replaceState({ ...history.state, skipSpoilerWarning: true }, '');
    this.#setStateFromUrl();
  };

  render(
    _: RenderableProps<Props>,
    { guessInputs, toAnalyze, showSpoilerWarning }: State,
  ) {
    return (
      <>
        <MainInstruction
          active={
            showSpoilerWarning
              ? 'spoilerWarning'
              : toAnalyze
              ? 'results'
              : 'enterWords'
          }
        />
        {showSpoilerWarning ? (
          <SpoilerWarning onClear={this.#onSpoilerClear} />
        ) : toAnalyze ? (
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
