import { h, Component, RenderableProps, Fragment } from 'preact';
import * as styles from './styles.module.css';
import * as utilStyles from '../../../utils.module.css';
import 'add-css:./styles.module.css';

interface Props {
  value: number;
}

interface State {}

export default class Progress extends Component<Props, State> {
  render({ value }: RenderableProps<Props>) {
    return (
      <div style={{ '--progress': value }} class={styles.progress}>
        <progress value={value} class={utilStyles.sr} />
      </div>
    );
  }
}
