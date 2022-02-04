import { h, Fragment, Component } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import * as utilStyles from '../../utils.module.css';

interface Props {
  onClear: () => void;
}

export default class SpoilerWarning extends Component<Props> {
  #onButtonClick = () => {
    this.props.onClear();
  };

  render() {
    return (
      <div class={[utilStyles.container, styles.spoilerWarning].join(' ')}>
        <p>
          This is an analysis of someone's Wordle play, which may include
          spoilers for today's Wordle. So, err, you might not want to see this
          until you've completed today's Wordle.
        </p>

        <div class={utilStyles.buttons}>
          <button
            type="button"
            class={utilStyles.button}
            onClick={this.#onButtonClick}
          >
            I understand, show me the analysis!
          </button>
        </div>
      </div>
    );
  }
}
