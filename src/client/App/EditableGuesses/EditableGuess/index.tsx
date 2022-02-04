import { h, Component, RenderableProps, createRef } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import Guess from '../../Guess';

interface Props {
  value: string;
  label: string;
  onInput: (value: string) => void;
  onEnter: (source: HTMLInputElement) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

interface State {
  inputHasFocus: boolean;
  selection?: [number, number];
}

export default class EditableGuess extends Component<Props, State> {
  state: State = {
    inputHasFocus: false,
    selection: undefined,
  };

  componentDidMount() {
    document.addEventListener('selectionchange', this.#selectionChange);
  }

  componentWillUnmount() {
    document.removeEventListener('selectionchange', this.#selectionChange);
  }

  #input = createRef<HTMLInputElement>();

  #onInputChange = (event: Event) => {
    this.props.onInput((event.currentTarget as HTMLInputElement).value);
    this.#selectionChange();
  };

  #onInputFocus = () => {
    this.setState({ inputHasFocus: true });
  };

  #onInputBlur = () => {
    this.setState({ inputHasFocus: false });
  };

  #onInputKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.props.onEnter(this.#input.current!);
    }
  };

  #onCellMouseDown = (index: number) => {
    this.#input.current!.focus();
    this.#input.current!.setSelectionRange(index, index + 1);
  };

  #selectionChange = () => {
    this.setState({
      selection:
        this.#input.current!.selectionStart !== null
          ? [
              this.#input.current!.selectionStart!,
              this.#input.current!.selectionEnd!,
            ]
          : undefined,
    });
  };

  render(
    { label, value, autoFocus, disabled }: RenderableProps<Props>,
    { selection, inputHasFocus }: State,
  ) {
    return (
      <div
        class={[styles.editableGuess, disabled && styles.disabled]
          .filter(Boolean)
          .join(' ')}
      >
        <div aria-hidden="true">
          <Guess
            value={value}
            selection={inputHasFocus ? selection : undefined}
            onCellMouseDown={this.#onCellMouseDown}
          />
        </div>
        <input
          disabled={disabled}
          aria-label={label}
          autoFocus={autoFocus}
          onFocus={this.#onInputFocus}
          onBlur={this.#onInputBlur}
          onKeyDown={this.#onInputKeyDown}
          ref={this.#input}
          type="text"
          maxLength={5}
          value={value}
          onInput={this.#onInputChange}
          class={styles.input}
        />
      </div>
    );
  }
}
