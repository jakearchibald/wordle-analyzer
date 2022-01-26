import { Component, RenderableProps, createRef } from 'preact';
import styles from './styles.module.css';
import Guess from '../Guess';

interface Props {
  initialValue?: string;
  label: string;
}

interface State {
  initialValue: string;
  value: string;
  inputHasFocus: boolean;
  selection?: [number, number];
}

export default class EditableGuess extends Component<Props, State> {
  state: State = {
    initialValue: '',
    value: '',
    inputHasFocus: false,
    selection: undefined,
  };

  static getDerivedStateFromProps(props: Props, state: State) {
    if (props.initialValue !== state.initialValue) {
      return {
        initialValue: props.initialValue,
        value: props.initialValue || '',
      };
    }
    return {};
  }

  componentDidMount() {
    document.addEventListener('selectionchange', this.#selectionChange);
  }

  componentWillUnmount() {
    document.removeEventListener('selectionchange', this.#selectionChange);
  }

  #input = createRef<HTMLInputElement>();

  #onInputChange = (event: Event) => {
    this.setState({
      value: (event.currentTarget as HTMLInputElement).value,
    });
    this.#selectionChange();
  };

  #onInputFocus = () => {
    this.setState({ inputHasFocus: true });
  };

  #onInputBlur = () => {
    this.setState({ inputHasFocus: false });
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
    { label }: RenderableProps<Props>,
    { value, selection, inputHasFocus }: State,
  ) {
    return (
      <div class={styles.editableGuess}>
        <div aria-hidden>
          <Guess
            value={value}
            selection={inputHasFocus ? selection : undefined}
            onCellMouseDown={this.#onCellMouseDown}
          />
        </div>
        <input
          aria-label={label}
          autoFocus={true}
          onFocus={this.#onInputFocus}
          onBlur={this.#onInputBlur}
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
