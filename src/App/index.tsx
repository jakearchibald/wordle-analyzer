import { Component } from 'preact';
import EditableGuess from './EditableGuess';
import Header from './Header';

export default class App extends Component {
  render() {
    return (
      <>
        <Header />
        {Array.from({ length: 7 }).map((_, index) => (
          <EditableGuess label={`Guess ${index + 1}`} />
        ))}
      </>
    );
  }
}
