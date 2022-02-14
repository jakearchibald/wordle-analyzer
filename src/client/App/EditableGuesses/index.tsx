import { h, Component, RenderableProps, createRef } from 'preact';
import EditableGuess from './EditableGuess';
import * as utilStyles from '../../utils.module.css';
import 'add-css:../../utils.module.css';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import Checkbox from '../Checkbox';

interface Props {
  values: string[];
  hardMode: boolean;
  onInput: (guesses: string[], hardMode: boolean) => void;
  onSubmit: (guesses: string[], hardMode: boolean) => void;
}

function getCompleteValues(values: string[]): number {
  const index = values.findIndex((value) => value.length !== 5);
  if (index === -1) return values.length;
  return index;
}

export default class EditableGuesses extends Component<Props> {
  #onGuessInputs: ((guess: string) => void)[];
  #onGuessInputOverflows: ((overflow: string) => void)[];
  #onGuessInitialBackspaces: (() => void)[];

  constructor(props: Props) {
    super(props);

    this.#onGuessInputs = props.values.map((_, index) => (guess: string) => {
      const guesses = [...this.props.values];
      guesses[index] = guess;
      this.props.onInput(guesses, this.props.hardMode);
    });

    this.#onGuessInputOverflows = props.values.map(
      (_, index) => (overflow: string) => {
        const guesses = [...this.props.values];
        // Can't overflow on the last input
        if (index === guesses.length - 1) return;
        // Don't overflow unless the next input is empty
        if (guesses[index + 1].length !== 0) return;

        const root = this.base as HTMLElement;
        const textInputs = [
          ...root.querySelectorAll<HTMLInputElement>('input[type="text"]'),
        ];

        textInputs[index + 1].focus();
        guesses[index + 1] = overflow.trim();
        this.props.onInput(guesses, this.props.hardMode);
      },
    );

    this.#onGuessInitialBackspaces = props.values.map((_, index) => () => {
      // Can't go back on the first input
      if (index === 0) return;

      const guesses = [...this.props.values];
      const root = this.base as HTMLElement;
      const textInputs = [
        ...root.querySelectorAll<HTMLInputElement>('input[type="text"]'),
      ];

      textInputs[index - 1].focus();
      guesses[index - 1] = guesses[index - 1].slice(0, -1);
      this.props.onInput(guesses, this.props.hardMode);
    });
  }

  #submit() {
    const complete = getCompleteValues(this.props.values);
    if (complete === 0) return;

    this.props.onSubmit(
      this.props.values.slice(0, complete).map((value) => value.toLowerCase()),
      this.props.hardMode,
    );
  }

  #onSubmit = (event: Event) => {
    event.preventDefault();
    this.#submit();
  };

  #onInputEnter = (source: HTMLInputElement) => {
    // Treat enter on an empty input as submit.
    if (source.value === '') {
      this.#submit();
      return;
    }

    const root = this.base as HTMLElement;
    const textInputs = [
      ...root.querySelectorAll<HTMLInputElement>('input[type="text"]'),
    ];
    const inputIndex = textInputs.indexOf(source);

    // If the input is the last one, submit.
    if (!textInputs[inputIndex + 1]) {
      this.#submit();
      return;
    }

    // Else, focus the next input.
    textInputs[inputIndex + 1].focus();
  };

  #onHardModeChange = (event: Event) => {
    this.props.onInput(
      this.props.values,
      (event.target as HTMLInputElement).checked,
    );
  };

  render({ values, hardMode }: RenderableProps<Props>) {
    const complete = getCompleteValues(values);

    return (
      <form onSubmit={this.#onSubmit}>
        <div class={styles.guesses}>
          {values.map((value, index) => (
            <EditableGuess
              onEnter={this.#onInputEnter}
              autoFocus={index === 0}
              disabled={index > complete}
              onInput={this.#onGuessInputs[index]}
              onInputOverflow={this.#onGuessInputOverflows[index]}
              onInputInitialBackspace={this.#onGuessInitialBackspaces[index]}
              value={value}
              label={`Guess ${index + 1}`}
            />
          ))}
        </div>
        <div class={[utilStyles.buttons, styles.buttons].join(' ')}>
          <button type="submit" class={utilStyles.button} disabled={!complete}>
            Analyze
          </button>
          <Checkbox onChange={this.#onHardModeChange} checked={hardMode}>
            Hard mode
          </Checkbox>
        </div>
      </form>
    );
  }
}
