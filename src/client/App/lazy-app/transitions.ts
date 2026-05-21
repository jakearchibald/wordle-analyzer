import {
  assignStyles,
  documentSmoothScroll,
  transitionHelper,
  TransitionHelperArg,
} from './utils';

export async function performToAnalysisTransition(
  updateDOM: TransitionHelperArg['updateDOM'],
) {
  // Early exit to avoid browsers throwing when they try to assignStyles to pseudos they're not familiar with.
  if (!('startViewTransition' in document)) {
    updateDOM();
    return;
  }

  transitionHelper({
    skipTransition: matchMedia('(prefers-reduced-motion: reduce)').matches,
    classNames: ['to-analysis'],
    updateDOM,
  });
}
