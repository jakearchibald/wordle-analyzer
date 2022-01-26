import { h, Fragment, Component, RenderableProps } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';

interface Props {
  active: keyof typeof instructions;
}

const instructions = {
  'enter-words': (
    <>
      <p>Enter the words you guessed, ending with the correct answer.</p>
    </>
  ),
  results: (
    <>
      <p>Here are your results:</p>
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
