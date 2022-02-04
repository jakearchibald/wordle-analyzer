import { h, Component } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';

export default class Header extends Component {
  render() {
    return (
      <header class={styles.header}>
        <h1>
          <a href="/">Wordle Analyzer</a>
        </h1>
      </header>
    );
  }
}
