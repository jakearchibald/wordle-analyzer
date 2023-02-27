import { assignStyles, transitionHelper, TransitionHelperArg } from './utils';

export async function performToAnalysisTransition(
  updateDOM: TransitionHelperArg['updateDOM'],
) {
  for (const [i] of Array.from({ length: 5 * 7 }).entries()) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const ident = `guess-cell-${row}-${col}`;

    assignStyles(`::view-transition-group(${ident})`, {
      transformStyle: 'preserve-3d',
    });

    assignStyles(`::view-transition-image-pair(${ident})`, {
      transformStyle: 'preserve-3d',
      isolation: 'auto',
      willChange: 'transform',
    });

    assignStyles(
      `::view-transition-new(${ident}), ::view-transition-old(${ident})`,
      {
        mixBlendMode: 'normal',
        backfaceVisibility: 'hidden',
        animation: 'none',
      },
    );

    assignStyles(`::view-transition-new(${ident})`, {
      transform: 'rotateX(180deg)',
    });
  }

  const transition = transitionHelper({
    skipTransition: matchMedia('(prefers-reduced-motion: reduce)').matches,
    classNames: ['to-analysis'],
    updateDOM,
  });

  await transition.ready;

  for (const [i] of Array.from({ length: 5 * 7 }).entries()) {
    const row = Math.floor(i / 5);
    const col = i % 5;

    // .persist here works around a Chrome bug.
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1418968
    document.documentElement
      .animate(
        {
          transform: ['rotateX(0deg)', 'rotateX(-180deg)'],
        },
        {
          duration: 300,
          delay: (row + col) * 30,
          easing: 'ease',
          pseudoElement: `::view-transition-image-pair(guess-cell-${row}-${col})`,
          fill: 'both',
        },
      )
      .persist();
  }
}
