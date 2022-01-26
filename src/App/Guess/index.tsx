import { Component, RenderableProps } from 'preact';
import styles from './styles.module.css';
import utilStyles from '../../utils.module.css';

export type CellClue = 'a' | 'p' | 'c';

interface Props {
  /** 5 chars of g (green), y (yellow), a (absent) */
  cellClues?: [CellClue, CellClue, CellClue, CellClue, CellClue];
  value: string;
  selection?: [number, number];
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
  render({ cellClues, value, selection }: RenderableProps<Props>) {
    return (
      <div class={styles.guess}>
        {fiveCells.map((index) => (
          <div
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
        {selection && selection[0] !== 5 && (
          <div
            class={styles.highlight}
            style={{ gridColumn: `${selection[0] + 1} / ${selection[1] + 1}` }}
          ></div>
        )}
      </div>
    );
  }
}
