export type CellState = 'active' | 'blocked';

export type TileType = 0 | 1 | 2 | 3 | 4;

export type SpecialType = 'none' | 'rocket_h' | 'rocket_v' | 'bomb';

export interface Tile {
  type: TileType;
  special: SpecialType;
}

export interface GridPos {
  row: number;
  col: number;
}

export interface MatchGroup {
  positions: GridPos[];
  isHorizontal: boolean;
}

export interface SwapResult {
  matched: boolean;
  matches: MatchGroup[];
}

export interface CascadeStep {
  removed: GridPos[];
  fallen: { from: GridPos; to: GridPos }[];
  spawned: { pos: GridPos; tile: Tile }[];
  specialsCreated: { pos: GridPos; special: SpecialType }[];
  specialsActivated: { pos: GridPos; special: SpecialType; affected: GridPos[] }[];
}

export interface EngineEvents {
  moveUsed: (movesLeft: number) => void;
  scoreChanged: (score: number) => void;
  levelComplete: (result: { score: number; movesUsed: number; starsEarned: number; objectivesCompleted: boolean }) => void;
  levelFailed: () => void;
  boardReshuffled: () => void;
  cascadeStep: (step: CascadeStep) => void;
  tileSwapped: (a: GridPos, b: GridPos) => void;
  swapRejected: (a: GridPos, b: GridPos) => void;
}
