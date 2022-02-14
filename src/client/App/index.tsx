import {
  h,
  Fragment,
  Component,
  RenderableProps,
  ComponentConstructor,
} from 'preact';
import EditableGuesses from './EditableGuesses';
import MainInstruction from './MainInstruction';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import 'add-css:../utils.module.css';
import { encode, decode } from './stupid-simple-cypher';
import SpoilerWarning from './SpoilerWarning';
import { swUpdatePending, activatePendingSw } from 'client/utils';
import Footer from './Footer';
import deferred from './deferred';

const lazyModule = import('./lazy-app');
const Analysis = deferred(lazyModule.then((m) => m.Analysis));
const Alerts = deferred(lazyModule.then((m) => m.Alerts));
const nullComponent = () => undefined;

function getStateUpdateFromURL(): Partial<State> {
  const urlParams = new URLSearchParams(location.search);

  if (!urlParams.has('guesses')) {
    return {
      toAnalyze: undefined,
    };
  }

  const seed = Number(urlParams.get('seed'));
  const guesses = urlParams.get('guesses')!;
  const hardMode = urlParams.get('hm') === '1';

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

  const decoded = decode(seed, guesses);
  const guessesArray = Array.from({ length: decoded.length / 5 }, (_, i) =>
    decoded.slice(i * 5, i * 5 + 5),
  );

  return {
    toAnalyze: {
      guesses: guessesArray.slice(0, 6),
      answer: guessesArray.slice(-1)[0],
      hardMode,
    },
    showSpoilerWarning: !history.state?.skipSpoilerWarning,
  };
}

interface Props {}

interface State {
  showSpoilerWarning: boolean;
  guessInputs: string[];
  hardModeInput: boolean;
  toAnalyze?: { guesses: string[]; answer: string; hardMode: boolean };
}

export default class App extends Component<Props, State> {
  state: State = {
    showSpoilerWarning: false,
    guessInputs: Array.from({ length: 7 }, () => ''),
    hardModeInput: localStorage.hardMode === '1',
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

  #onGuessesInput = (guesses: string[], hardMode: boolean) => {
    this.setState({ guessInputs: guesses, hardModeInput: hardMode });
  };

  #onGuessesSubmit = (guesses: string[], hardMode: boolean) => {
    const seed = Math.floor(Math.random() * 100);
    const joinedAnswers = guesses.join('');
    const encoded = encode(seed, joinedAnswers);
    const url = new URL('./', location.href);
    url.searchParams.set('seed', seed.toString());
    url.searchParams.set('guesses', encoded);
    url.searchParams.set('hm', hardMode ? '1' : '0');

    // Remember hardMode setting
    localStorage.hardMode = hardMode ? '1' : '0';

    history.pushState({ skipSpoilerWarning: true }, '', url);
    this.#setStateFromUrl();
  };

  #onSpoilerClear = () => {
    history.replaceState({ ...history.state, skipSpoilerWarning: true }, '');
    this.#setStateFromUrl();
  };

  #renderAlerts = (AlertsComponent: Awaited<typeof lazyModule>['Alerts']) => {
    return <AlertsComponent />;
  };

  #renderAnalysis = (
    AnalysisComponent: Awaited<typeof lazyModule>['Analysis'],
  ) => {
    return (
      <AnalysisComponent
        hardMode={this.state.toAnalyze!.hardMode}
        answer={this.state.toAnalyze!.answer}
        guesses={this.state.toAnalyze!.guesses}
      />
    );
  };

  render(
    _: RenderableProps<Props>,
    { guessInputs, toAnalyze, showSpoilerWarning, hardModeInput }: State,
  ) {
    return (
      <>
        <div>
          <MainInstruction
            active={
              showSpoilerWarning
                ? 'spoilerWarning'
                : toAnalyze
                ? 'results'
                : 'enterWords'
            }
          />
          {toAnalyze ? (
            <>
              <div style={{ display: showSpoilerWarning ? 'none' : '' }}>
                <Analysis
                  loading={nullComponent}
                  loaded={this.#renderAnalysis}
                />
              </div>
              {showSpoilerWarning && (
                <SpoilerWarning onClear={this.#onSpoilerClear} />
              )}
            </>
          ) : (
            <EditableGuesses
              values={guessInputs}
              onInput={this.#onGuessesInput}
              onSubmit={this.#onGuessesSubmit}
              hardMode={hardModeInput}
            />
          )}
        </div>
        <Footer />
        <Alerts loading={nullComponent} loaded={this.#renderAlerts} />
      </>
    );
  }
}
