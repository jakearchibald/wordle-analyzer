export type FiveLetters = [string, string, string, string, string];

export interface Clue {
  positionalMatches: FiveLetters;
  positionalNotMatches: FiveLetters;
  additionalRequiredLetters: string[];
  remainingMustNotContain: Set<string>;
}

export interface PlayAnalysis {
  guess: string;
  colors: CellColors;
  validForHardMode: boolean;
  unusedClues: string[];
  averageEliminations: number;
  actualEliminations: number;
  commonWord: boolean;
}

export interface GuessAnalysis {
  guessInDictionary: boolean;
  remainingAnswers: RemainingAnswers;
  clue: Clue;
  plays: [user: PlayAnalysis, ai: PlayAnalysis];
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
