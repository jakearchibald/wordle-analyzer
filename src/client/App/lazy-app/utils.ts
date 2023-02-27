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

export interface TransitionHelperArg {
  skipTransition?: boolean;
  classNames?: string[];
  updateDOM: () => void;
}

export function transitionHelper({
  skipTransition = false,
  classNames = [],
  updateDOM,
}: TransitionHelperArg) {
  if (skipTransition || !document.startViewTransition) {
    const updateCallbackDone = Promise.resolve(updateDOM()).then(() => {});

    return {
      ready: Promise.reject(Error('View transitions unsupported')),
      updateCallbackDone,
      finished: updateCallbackDone,
      skipTransition: () => {},
    };
  }

  document.documentElement.classList.add(...classNames);

  const transition = document.startViewTransition(updateDOM);

  transition.finished.finally(() =>
    document.documentElement.classList.remove(...classNames),
  );

  return transition;
}

const style = document.createElement('style');
const styleMap = new Map<string, CSSStyleDeclaration>();

export function getStyleDeclaration(selector: string): CSSStyleDeclaration {
  if (!styleMap.has(selector)) {
    if (!style.isConnected) document.head.append(style);
    const newIndex = style.sheet!.cssRules.length;
    style.sheet!.insertRule(`${selector} {}`, newIndex);
    const styleRule = style.sheet!.cssRules[newIndex] as CSSStyleRule;
    styleMap.set(selector, styleRule.style);
  }

  return styleMap.get(selector)!;
}

export function assignStyles(
  selector: string,
  styles: Partial<CSSStyleDeclaration>,
): void {
  Object.assign(getStyleDeclaration(selector), styles);
}
