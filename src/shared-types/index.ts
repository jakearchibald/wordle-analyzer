export type FiveLetters = [string, string, string, string, string];

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
  remainingAnswers: RemainingAnswers;
  averageRemaining: { common: number; all: number } | undefined;
  commonWord: boolean;
}

export interface GuessAnalysis {
  beforeRemainingCounts: { common: number; other: number };
  plays: { user: PlayAnalysis; ai: PlayAnalysis; aiStrategy: AIStrategy };
}

export interface AIPlay {
  beforeRemainingCounts: { common: number; other: number };
  play: PlayAnalysis;
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

export type RemainingEntry = [word: string, averageRemaining: number];
export type RemainingAverages = RemainingEntry[];
export type RemainingResult = {
  common: RemainingAverages;
  all: RemainingAverages;
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
