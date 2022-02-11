import { h, Component, RenderableProps } from 'preact';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import * as utilStyles from '../../../../utils.module.css';
import { RemainingAnswers } from 'shared-types/index';

interface Props {
  remainingToDisplay: RemainingAnswers;
}

interface State {}

export default class RemainingList extends Component<Props, State> {
  render({ remainingToDisplay }: RenderableProps<Props>) {
    const allItems = [
      ...remainingToDisplay.common,
      ...remainingToDisplay.other,
    ];

    return (
      <ul class={styles.remainingList}>
        {allItems.map((word, i) => (
          <li
            style={{ opacity: i < remainingToDisplay.common.length ? 1 : 0.5 }}
          >
            <a
              class={[utilStyles.hiddenLink, styles.remainingWord].join(' ')}
              target="_blank"
              href={`https://en.wiktionary.org/wiki/${word}`}
            >
              {[...word].map((letter) => (
                <span class={styles.remainingLetter}>
                  {letter.toUpperCase()}
                </span>
              ))}
            </a>
          </li>
        ))}
      </ul>
    );
  }
}
