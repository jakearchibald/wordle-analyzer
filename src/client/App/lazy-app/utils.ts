import { RemainingAnswers } from 'shared-types/index';

export function animateTo(
  element: HTMLElement,
  to: Keyframe[] | PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions,
) {
  const anim = element.animate(to, { ...options, fill: 'both' });
  anim.addEventListener('finish', () => {
    try {
      anim.commitStyles();
      anim.cancel();
    } catch (e) {}
  });
  return anim;
}

export function animateFrom(
  element: HTMLElement,
  from: PropertyIndexedKeyframes,
  options: KeyframeAnimationOptions,
) {
  return element.animate(
    { ...from, offset: 0 },
    { ...options, fill: 'backwards' },
  );
}

const numFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
export const formatNumber = (n: number) => numFormat.format(n);

export function doAbortable<R>(
  signal: AbortSignal,
  callback: (
    setAbortAction: (abortAction: () => void) => void,
  ) => R | Promise<R>,
): Promise<R> {
  if (signal.aborted) throw new DOMException('', 'AbortError');
  let onAbort: () => void;
  let listener: () => void;
  let onAbortReturn: any;
  const setAbortAction = (c: () => void) => {
    onAbort = c;
  };
  const promise = callback(setAbortAction);

  return Promise.race([
    new Promise<R>((_, reject) => {
      listener = () => {
        reject(new DOMException('', 'AbortError'));
        onAbortReturn = onAbort?.();
      };
      signal.addEventListener('abort', listener);
    }),
    promise,
  ]).finally(() => {
    signal.removeEventListener('abort', listener);
    return onAbortReturn;
  });
}

export const enum RemainingItemsType {
  None,
  CommonOnly,
  All,
}

const maxRemainingToDisplay = 30;

export function filterRemainingItemsForMaxDisplay(
  remainingAnswers: RemainingAnswers,
):
  | { remaining: RemainingAnswers; remainingType: RemainingItemsType }
  | undefined {
  const remainingCount =
    remainingAnswers.common.length + remainingAnswers.other.length;
  let remaining: RemainingAnswers | undefined = undefined;
  let remainingType: RemainingItemsType = RemainingItemsType.None;

  if (remainingAnswers) {
    if (remainingCount <= maxRemainingToDisplay) {
      remainingType = RemainingItemsType.All;
      remaining = remainingAnswers;
    } else if (remainingAnswers.common.length <= maxRemainingToDisplay) {
      remainingType = RemainingItemsType.CommonOnly;
      remaining = { ...remainingAnswers, other: [] };
    }
  }

  return remaining ? { remaining, remainingType } : undefined;
}
