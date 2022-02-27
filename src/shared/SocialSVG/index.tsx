import type { CellColors } from 'shared-types/index';
import { h, FunctionalComponent, Fragment } from 'preact';
import * as styles from './styles.module.css';
import cssSrc from 'css:./styles.module.css';
import { escapeStyleScriptContent, luckValues } from 'shared/utils';
import Star from './star';

function getSizeValues(entryCount: number) {
  return {
    footerHeight: 97,
    footerFontSize: 38,
    footerFontShift: 12,
    columnFontSize: 48,
    columnFontShift: 18,
    headerHeight: 97,
    columnWidth: 538,
    tableGap: 10,
    guessSize: entryCount < 5 ? 130 : 97,
    starSize: entryCount < 5 ? 80 : 65,
    starGap: 3,
  };
}

interface SocialImageEntry {
  colors: CellColors;
  stars: number;
  luckIndex: number;
}

export interface Props {
  entries: SocialImageEntry[];
}

const width = 1920;
const height = 960;

const SocialSVG: FunctionalComponent<Props> = ({ entries }) => {
  const {
    footerHeight,
    footerFontSize,
    columnWidth,
    guessSize,
    columnFontSize,
    columnFontShift,
    footerFontShift,
    headerHeight,
    tableGap,
    starSize,
    starGap,
  } = getSizeValues(entries.length);

  const mainHeight = height - footerHeight;
  const tableHeight = headerHeight + (tableGap + guessSize) * entries.length;
  const guessWidth = (guessSize + tableGap) * 5;
  const tableWidth = guessWidth + columnWidth * 2 + tableGap;
  const tableXStart = (width - tableWidth) / 2;
  const tableYStart = (mainHeight - tableHeight) / 2;
  const starsWidth = starSize * 5 + starGap * 4;
  const starXStart = tableXStart + guessWidth + (columnWidth - starsWidth) / 2;

  const colorToClass = {
    a: styles.absent,
    p: styles.present,
    c: styles.correct,
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      class={styles.root}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: escapeStyleScriptContent(cssSrc),
        }}
      />

      <rect
        class={styles.header}
        x={tableXStart + guessWidth}
        y={tableYStart}
        width={columnWidth}
        height={headerHeight}
      />
      <text
        class={styles.centerText}
        x={tableXStart + guessWidth + columnWidth / 2}
        y={tableYStart + headerHeight / 2}
        dy={columnFontShift}
        font-size={columnFontSize}
      >
        Skill
      </text>
      <rect
        class={styles.header}
        x={tableXStart + guessWidth + columnWidth + tableGap}
        y={tableYStart}
        width={columnWidth}
        height={headerHeight}
      />
      <text
        class={styles.centerText}
        x={tableXStart + guessWidth + columnWidth + tableGap + columnWidth / 2}
        y={tableYStart + headerHeight / 2}
        dy={columnFontShift}
        font-size={columnFontSize}
      >
        Luck
      </text>

      {entries.map((entry, i) => {
        const rowYStart =
          tableYStart + headerHeight + tableGap + i * (guessSize + tableGap);

        return (
          <>
            {entry.colors.map((color, j) => (
              <rect
                x={tableXStart + j * (guessSize + tableGap)}
                y={rowYStart}
                class={colorToClass[color]}
                width={guessSize}
                height={guessSize}
              />
            ))}
            {Array.from({ length: 5 }).map((_, starIndex) => (
              <Star
                width={starSize}
                height={starSize}
                y={rowYStart + (guessSize - starSize) / 2}
                x={starXStart + starIndex * (starSize + starGap)}
                class={starIndex + 1 <= entry.stars ? styles.starActive : ' '}
              />
            ))}
            <text
              class={styles.centerText}
              x={
                tableXStart +
                guessWidth +
                columnWidth +
                tableGap +
                columnWidth / 2
              }
              y={rowYStart + guessSize / 2}
              dy={columnFontShift}
              font-size={columnFontSize}
            >
              {luckValues[entry.luckIndex]}
            </text>
          </>
        );
      })}

      <rect
        class={styles.footer}
        x="0"
        y={height - footerHeight}
        width={width}
        height={footerHeight}
      />
      <text
        class={styles.text}
        x="30"
        y={height - footerHeight / 2}
        dy={footerFontShift}
        font-size={footerFontSize}
      >
        wordle-analyzer.com
      </text>
    </svg>
  );
};

export default SocialSVG;
