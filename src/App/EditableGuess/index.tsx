import { Component, RenderableProps, createRef } from 'preact';
import styles from './styles.module.css';
import utilStyles from '../../utils.module.css';
import Guess from '../Guess';

interface Props {
  initialValue?: string;
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

  #inputChange = (event: Event) => {
    this.setState({
      value: (event.currentTarget as HTMLInputElement).value,
    });
    this.#selectionChange();
  };

  #inputFocus = () => {
    this.setState({ inputHasFocus: true });
  };

  #inputBlur = () => {
    this.setState({ inputHasFocus: false });
  };

  #guessClick = () => {
    this.#input.current?.focus();
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
    {}: RenderableProps<Props>,
    { value, selection, inputHasFocus }: State,
  ) {
    return (
      <div class={styles.editableGuess}>
        <div aria-hidden onClick={this.#guessClick}>
          <Guess
            value={value}
            selection={inputHasFocus ? selection : undefined}
          />
        </div>
        <input
          autoFocus={true}
          onFocus={this.#inputFocus}
          onBlur={this.#inputBlur}
          ref={this.#input}
          type="text"
          maxLength={5}
          value={value}
          onInput={this.#inputChange}
          class={styles.input}
        />
      </div>
    );
  }
}
