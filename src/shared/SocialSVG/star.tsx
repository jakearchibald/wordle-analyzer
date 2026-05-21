import { h, FunctionalComponent, Fragment } from 'preact';
import * as styles from './styles.module.css';

interface Props extends preact.JSX.SVGAttributes<SVGSVGElement> {}

const Star: FunctionalComponent<Props> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path
      class={styles.starBody}
      d="M68 7.2 81.5 38a7 7 0 0 0 5.8 4.2l32.8 3c3.7.5 5.2 5 2.5 7.7L98 73.5a7 7 0 0 0-2.3 6.9l7.1 33.6a4.5 4.5 0 0 1-6.5 4.8L67.6 102a7 7 0 0 0-7.2 0l-28.6 16.8a4.5 4.5 0 0 1-6.5-4.8l7.1-33.6a7 7 0 0 0-2.3-6.9L5.4 52.8A4.5 4.5 0 0 1 7.9 45l32.8-3a7 7 0 0 0 5.8-4.2L59.9 7.2a4.5 4.5 0 0 1 8.1 0z"
    />
    <path
      class={styles.starHighlight}
      d="m67 39.8-2.2-22.6c-.1-1.3-.4-3.5 1.7-3.5 1.6 0 2.4 3.4 2.4 3.4l6.9 18.1c2.5 7 1.5 9.3-1 10.7-2.9 1.6-7 .4-7.7-6.1z"
    />
    <path
      class={styles.starLowlight}
      d="m95.3 71.5 19.6-15.3c1-.8 2.7-2.1 1.3-3.6-1-1.1-4 .5-4 .5l-17.3 6.7c-5 1.8-8.5 4.4-8.8 7.7-.4 4.4 3.6 7.8 9.2 4z"
    />
  </svg>
);

export default Star;
