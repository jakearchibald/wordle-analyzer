import { Component } from 'preact';
import styles from './styles.module.css';

export default class Header extends Component {
  render() {
    return (
      <header class={styles.header}>
        <h1>Wordle Analyzer</h1>
      </header>
    );
  }
}
