import { h, Component, RenderableProps, Fragment } from 'preact';
import * as utilStyles from '../../../utils.module.css';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';
import { CellColors } from 'shared-types/index';
import { alert } from '../../Alerts';

const blocks = {
  a: '⬜',
  p: '🟨',
  c: '🟩',
} as const;

function getShareUrl() {
  const url = new URL(location.href);
  url.hash = '';
  return url.href;
}

function createShareText(cellColors: CellColors[], foundAnswer: boolean) {
  const lines = [
    `Wordle ${foundAnswer ? cellColors.length : 'X'}/6`,
    '',
    ...cellColors.map((colors) =>
      colors.map((color) => blocks[color]).join(''),
    ),
  ];

  return lines.join('\n');
}

interface Props {
  cellColors: CellColors[];
  foundAnswer: boolean;
}

interface State {}

export default class Share extends Component<Props, State> {
  #onButtonClick = () => {
    // Avoid the share API if the user agent isn't 'mobile'.
    // On Safari macOS at least, the experience is pretty bad.
    if ('share' in navigator && navigator.userAgent.includes('Mobile')) {
      navigator
        .share({
          url: getShareUrl(),
          text: createShareText(this.props.cellColors, this.props.foundAnswer),
        })
        .catch(() => {});
      return;
    }

    navigator.clipboard.writeText(
      createShareText(this.props.cellColors, this.props.foundAnswer) +
        '\n\n' +
        getShareUrl(),
    );
    alert('Copied to clipboard');
  };

  render({}: RenderableProps<Props>) {
    return (
      <div class={styles.share}>
        <div class={utilStyles.buttons}>
          <button
            type="button"
            class={utilStyles.buttonWithIcon}
            onClick={this.#onButtonClick}
          >
            Share
            <svg viewBox="0 0 24 24">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
            </svg>
          </button>
        </div>
        <p>
          Shared analyses come with a spoiler warning (
          <a target="_blank" href={location.href}>
            preview
          </a>
          ).
        </p>
      </div>
    );
  }
}
