interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
}

interface Document {
  startViewTransition(setupPromise: () => Promise<void> | void): ViewTransition;
}

interface CSSStyleDeclaration {
  viewTransitionName: string;
}

declare module 'eval:*' {
  const val: unknown;
  export default val;
}
