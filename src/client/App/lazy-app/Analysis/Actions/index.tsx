import { h, Component, RenderableProps, Fragment } from 'preact';
import * as utilStyles from '../../../../utils.module.css';
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
    '',
    getShareUrl(),
  ];

  return lines.join('\n');
}

interface Props {
  cellColors: CellColors[];
  foundAnswer: boolean;
}

interface State {}

export default class Actions extends Component<Props, State> {
  #onShareClick = () => {
    // Avoid the share API if the user agent isn't 'mobile'.
    // On Safari macOS at least, the experience is pretty bad.
    if ('share' in navigator && /Mobile|Android/.test(navigator.userAgent)) {
      navigator
        .share({
          text: createShareText(this.props.cellColors, this.props.foundAnswer),
        })
        .catch(() => {});
      return;
    }

    navigator.clipboard.writeText(
      createShareText(this.props.cellColors, this.props.foundAnswer),
    );
    alert('Copied to clipboard');
  };

  render({}: RenderableProps<Props>) {
    return (
      <div class={utilStyles.container}>
        <div class={styles.actions}>
          <div class={utilStyles.buttons}>
            <button
              type="button"
              class={utilStyles.buttonWithIcon}
              onClick={this.#onShareClick}
            >
              Share
              <svg viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
              </svg>
            </button>
            <a class={utilStyles.buttonWithIcon} href="/">
              New analysis
              <svg viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM5.92 19H5v-.92l9.06-9.06.92.92L5.92 19zM20.71 5.63l-2.34-2.34c-.2-.2-.45-.29-.71-.29s-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83a1 1 0 0 0 0-1.41z" />
              </svg>
            </a>
          </div>
          <p>
            Shared analyses come with a spoiler warning (
            <a target="_blank" href={location.href}>
              preview
            </a>
            ).
          </p>
        </div>
      </div>
    );
  }
}
