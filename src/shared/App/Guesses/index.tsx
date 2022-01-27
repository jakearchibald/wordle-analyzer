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

function inputValid(values: string[]) {
  return values.some((value) => value.length === 5);
}

export default class Guesses extends Component<Props> {
  #onInputs: ((guess: string) => void)[];

  #onSubmit = (event: Event) => {
    event.preventDefault();
    if (!inputValid(this.props.values)) return;

    this.props.onSubmit(
      this.props.values.filter((value) => value.length === 5),
    );
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
    return (
      <form onSubmit={this.#onSubmit}>
        <div class={styles.guesses}>
          {values.map((value, index) => (
            <EditableGuess
              onInput={this.#onInputs[index]}
              value={value}
              label={`Guess ${index + 1}`}
            />
          ))}
        </div>
        {!__PRERENDER__ && (
          <div class={styles.buttons}>
            <button
              type="submit"
              class={utilStyles.button}
              disabled={!inputValid(values)}
            >
              Analyse
            </button>
          </div>
        )}
      </form>
    );
  }
}
