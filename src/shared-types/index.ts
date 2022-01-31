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
  averageEliminations: number;
  actualEliminations: number;
}

export interface GuessAnalysis {
  guessInDictionary: boolean;
  remainingAnswers: string[];
  /** Any reasons the clue had already been eliminated */
  guessRedundancy: string[];
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
