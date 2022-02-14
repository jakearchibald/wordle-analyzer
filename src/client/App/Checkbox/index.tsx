import { h, Fragment, Component, RenderableProps, JSX } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';

type Props = JSX.IntrinsicElements['input'];

export default class Checkbox extends Component<Props> {
  render(props: RenderableProps<Props>) {
    return (
      <label class={styles.checkbox}>
        <input {...props} type="checkbox" class={styles.checkboxInput} />
        <svg class={styles.checkboxIcon} viewBox="0 0 24 24">
          <path d="M19 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V5h14v14z" />
          <path
            class={styles.checkboxTick}
            d="M18 9l-1.4-1.4-6.6 6.6-2.6-2.6L6 13l4 4z"
          />
        </svg>
        {props.children}
      </label>
    );
  }
}
