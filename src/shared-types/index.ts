export type FiveLetters = [string, string, string, string, string];
export interface Luck {
  good: boolean;
  chance: number;
}

export interface Clue {
  positionalMatches: FiveLetters;
  positionalNotMatches: FiveLetters;
  additionalRequiredLetters: string[];
  remainingMustNotContain: Set<string>;
}

export interface PlayAnalysis {
  guess: string;
  clue: Clue;
  colors: CellColors;
  hardModeViolations: string[];
  unusedClues: string[];
  averageRemaining: { common: number; all: number } | undefined;
  remainingAnswers: RemainingAnswers;
  luck: Luck | undefined;
  commonWord: boolean;
  guessQuality: number | undefined;
}

export interface GuessAnalysis {
  beforeRemainingCounts: { common: number; other: number };
  plays: {
    user: PlayAnalysis;
    ai: PlayAnalysis;
    aiStrategy: AIStrategy;
    /** Undefined if both are equal */
    bestPlay: PlayAnalysis | undefined;
  };
}

export interface AIPlay {
  beforeRemainingCounts: { common: number; other: number };
  play: PlayAnalysis;
  strategy: AIStrategy;
}

/** (a)bsent (p)resent (c)orrect */
export type CellColor = 'a' | 'p' | 'c';

export type CellColors = [
  CellColor,
  CellColor,
  CellColor,
  CellColor,
  CellColor,
];

export type RemainingCounts = [word: string, remainingCounts: number[]][];
export type RemainingAverages = [word: string, averageRemaining: number][];
export type RemainingAveragesResult = {
  common: RemainingAverages;
  all: RemainingAverages;
};
export type RemainingCountsResult = {
  common: RemainingCounts;
  all: RemainingCounts;
};

export type RemainingAnswers = { common: string[]; other: string[] };

export const enum AIStrategy {
  EliminateCommon,
  EliminateCommonWithAnswer,
  Play5050Common,
  PlaySingleCommon,
  EliminateUncommon,
  EliminateUncommonWithAnswer,
  Play5050Uncommon,
  PlaySingleUncommon,
}
