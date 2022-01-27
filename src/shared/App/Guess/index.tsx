import { h, Component, RenderableProps } from 'preact';
import * as utilStyles from '../../utils.module.css';
import 'add-css:../../utils.module.css';
import * as styles from './styles.module.css';
import 'add-css:./styles.module.css';

export type CellClue = 'a' | 'p' | 'c';

interface Props {
  /** 5 chars of g (green), y (yellow), a (absent) */
  cellClues?: [CellClue, CellClue, CellClue, CellClue, CellClue];
  value: string;
  selection?: [number, number];
  onCellMouseDown?: (index: number) => void;
}

const fiveCells = [0, 1, 2, 3, 4] as const;

const cellCluesStyleMap = {
  a: styles.absent,
  p: styles.present,
  c: styles.correct,
};

const cellClueSrTextMap = {
  a: 'absent',
  p: 'present',
  c: 'correct',
};

export default class Guess extends Component<Props> {
  #onMouseDown = (event: Event) => {
    event.preventDefault();
    const el = event.target as HTMLElement;
    const cell = el.closest(`.${styles.cell}`) as HTMLElement | undefined;
    if (!cell) return;
    const index = Number(cell.dataset.index);
    this.props.onCellMouseDown?.(index);
  };

  render({ cellClues, value, selection }: RenderableProps<Props>) {
    return (
      <div class={styles.guess} onMouseDown={this.#onMouseDown}>
        {selection && (
          <div
            key={'selection'}
            class={[
              styles.highlight,
              selection[0] === selection[1] && styles.singleHighlight,
              selection[1] === 5 && styles.lastHighlight,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              gridColumn: `${Math.min(5, selection[0] + 1)} / ${
                selection[1] + 1
              }`,
            }}
          ></div>
        )}
        {fiveCells.map((index) => (
          <div
            key={'cell' + index}
            data-index={index}
            class={[
              styles.cell,
              cellClues && cellCluesStyleMap[cellClues[index]],
              value[index] && styles.hasChar,
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ gridColumn: index + 1 }}
          >
            {value[index]}
            {cellClues && (
              <span class={utilStyles.sr}>
                ({cellClueSrTextMap[cellClues[index]]})
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }
}
