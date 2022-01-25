import { Component } from 'preact';
import Guess from './Guess';
import Header from './Header';

export default class App extends Component {
  render() {
    return (
      <>
        <Header />
        <Guess cellClues={['c', 'p', 'a', 'a', 'a']} value="hello" />
      </>
    );
  }
}
