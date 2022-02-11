import { h, Component } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';

export default class Footer extends Component {
  render() {
    return (
      <footer class={styles.footer}>
        <ul class={styles.footerLinks}>
          <li>
            Thrown together by{' '}
            <a target="_blank" href="https://twitter.com/jaffathecake">
              Jake Archibald
            </a>
          </li>
          <li>
            <a
              target="_blank"
              href="https://github.com/jakearchibald/wordle-analyzer/"
            >
              View the source
            </a>
          </li>
          <li>
            <a
              target="_blank"
              href="https://www.nytimes.com/games/wordle/index.html"
            >
              Play Wordle
            </a>
          </li>
        </ul>
      </footer>
    );
  }
}
