import { Component, RenderableProps } from 'preact';
import styles from './styles.module.css';

type CellClue = 'a' | 'p' | 'c';

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

export default class Guess extends Component<Props> {
  render({ cellClues, value }: RenderableProps<Props>) {
    return (
      <div aria-hidden class={styles.guess}>
        {fiveCells.map((index) => (
          <div
            class={[
              styles.cell,
              cellClues && cellCluesStyleMap[cellClues[index]],
              value[index] !== ' ' && styles.hasChar,
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {value[index]}
          </div>
        ))}
      </div>
    );
  }
}
