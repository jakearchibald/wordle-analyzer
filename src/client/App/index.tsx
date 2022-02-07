import { h, Fragment, Component, RenderableProps } from 'preact';
import EditableGuesses from './EditableGuesses';
import MainInstruction from './MainInstruction';
import Analysis from './Analysis';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import 'add-css:../utils.module.css';
import { encode, decode } from './stupid-simple-cypher';
import SpoilerWarning from './SpoilerWarning';
import Alerts from './Alerts';
import { swUpdatePending, activatePendingSw } from 'client/utils';
import Footer from './Footer';

function getStateUpdateFromURL(): Partial<State> {
  const urlParams = new URLSearchParams(location.search);

  if (!urlParams.has('guesses')) {
    return {
      toAnalyze: undefined,
    };
  }

  const seed = Number(urlParams.get('seed'));
  const guesses = urlParams.get('guesses')!;

  if (
    Number.isNaN(seed) ||
    !/^[a-z]+$/.test(guesses) ||
    guesses.length % 5 ||
    guesses.length / 5 > 7
  ) {
    return { toAnalyze: undefined };
  }

  if (sessionStorage.skipNextSpoilerWarning) {
    sessionStorage.skipNextSpoilerWarning = '';
    history.replaceState({ ...history.state, skipSpoilerWarning: true }, '');
  }

  if (!history.state?.skipSpoilerWarning) {
    return {
      showSpoilerWarning: true,
    };
  }

  const decoded = decode(seed, guesses);
  const guessesArray = Array.from({ length: decoded.length / 5 }, (_, i) =>
    decoded.slice(i * 5, i * 5 + 5),
  );

  return {
    toAnalyze: {
      guesses: guessesArray,
      answer: guessesArray.slice(-1)[0],
    },
    showSpoilerWarning: false,
  };
}

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
    ...getStateUpdateFromURL(),
  };

  componentDidMount() {
    addEventListener('popstate', () => this.#setStateFromUrl());
  }

  async #setStateFromUrl() {
    // If there's a pending update, this is an ideal time to let it happen.
    if (await swUpdatePending()) {
      // This will also trigger a reload of the page.
      // (see addServiceWorker() in client/utils.ts)
      activatePendingSw();
      return;
    }

    this.setState(getStateUpdateFromURL());
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
        <Footer />
        <Alerts />
      </>
    );
  }
}
