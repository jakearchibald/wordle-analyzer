import { Component } from 'preact';
import EditableGuess from './EditableGuess';
import Header from './Header';

export default class App extends Component {
  render() {
    return (
      <>
        <Header />
        <EditableGuess />
      </>
    );
  }
}
