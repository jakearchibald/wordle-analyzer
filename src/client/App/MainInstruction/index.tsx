import { h, Fragment, Component, RenderableProps, JSX } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';

interface Props {
  active: keyof typeof instructions;
}

const instructions = {
  enterWords: (
    <>
      <p>
        Enter the words you guessed while playing{' '}
        <a
          target="_blank"
          href="https://www.nytimes.com/games/wordle/index.html"
        >
          Wordle
        </a>
        , finishing with the correct answer.
      </p>
    </>
  ),
  spoilerWarning: (
    <>
      <p>Spoiler warning!</p>
    </>
  ),
  results: (
    <>
      <p>Here are the results:</p>
    </>
  ),
} as const;

const instructionEntries = Object.entries(instructions) as [
  keyof typeof instructions,
  JSX.Element,
][];

export default class MainInstruction extends Component<Props> {
  render({ active }: RenderableProps<Props>) {
    return (
      <div class={styles.instructions}>
        {instructionEntries.map(([key, content]) => (
          <div aria-hidden={key !== active}>{content}</div>
        ))}
      </div>
    );
  }
}
