import { h, Component, RenderableProps } from 'preact';
import EditableGuess from './EditableGuess';
import * as utilStyles from '../../utils.module.css';
import 'add-css:../../utils.module.css';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';

interface Props {
  values: string[];
  onInput: (guesses: string[]) => void;
  onSubmit: (guesses: string[]) => void;
}

function getCompleteValues(values: string[]): number {
  const index = values.findIndex((value) => value.length !== 5);
  if (index === -1) return values.length;
  return index;
}

export default class EditableGuesses extends Component<Props> {
  #onInputs: ((guess: string) => void)[];

  #submit() {
    const complete = getCompleteValues(this.props.values);
    if (complete === 0) return;

    this.props.onSubmit(
      this.props.values.slice(0, complete).map((value) => value.toLowerCase()),
    );
  }

  #onSubmit = (event: Event) => {
    event.preventDefault();
    this.#submit();
  };

  #onEnter = (source: HTMLInputElement) => {
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

  constructor(props: Props) {
    super(props);

    this.#onInputs = props.values.map((_, index) => (guess: string) => {
      const guesses = [...this.props.values];
      guesses[index] = guess;
      this.props.onInput(guesses);
    });
  }

  render({ values }: RenderableProps<Props>) {
    const complete = getCompleteValues(values);

    return (
      <form onSubmit={this.#onSubmit}>
        <div class={styles.guesses}>
          {values.map((value, index) => (
            <EditableGuess
              onEnter={this.#onEnter}
              autoFocus={index === 0}
              disabled={index > complete}
              onInput={this.#onInputs[index]}
              value={value}
              label={`Guess ${index + 1}`}
            />
          ))}
        </div>
        <div class={styles.buttons}>
          <button type="submit" class={utilStyles.button} disabled={!complete}>
            Analyze
          </button>
        </div>
      </form>
    );
  }
}
