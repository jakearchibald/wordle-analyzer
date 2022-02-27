import type { CellColors } from 'shared-types/index';
import { h, FunctionalComponent } from 'preact';
import * as styles from './styles.module.css';
import cssSrc from 'css:./styles.module.css';
import { escapeStyleScriptContent } from 'shared/utils';

interface SocialImageEntry {
  colors: CellColors;
}

interface Props {
  entries: SocialImageEntry[];
}

const SocialSVG: FunctionalComponent<Props> = ({ entries }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 960" fill="none">
    <style
      dangerouslySetInnerHTML={{
        __html: escapeStyleScriptContent(cssSrc),
      }}
    />
    <rect class={styles.tmp} x="0" y="0" width="1920" height="960" />
  </svg>
);

export default SocialSVG;
