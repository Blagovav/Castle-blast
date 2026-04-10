export type ObjectiveType = 'score' | 'collect' | 'destroy_blockers';

export interface LevelObjective {
  type: ObjectiveType;
  target: number;
  tileType?: number; // for 'collect' objectives
}

export interface LevelDefinition {
  level: number;
  gridWidth: number;
  gridHeight: number;
  tileTypes: number;
  maxMoves: number;
  blocked: [number, number][]; // [col, row]
  objectives: LevelObjective[];
  starThresholds: [number, number, number]; // 1-star, 2-star, 3-star
  rngBiasThreshold: number;
}

export interface LevelResult {
  levelNum: number;
  score: number;
  movesUsed: number;
  starsEarned: number; // 0 = failed, 1-3 = passed
  objectivesCompleted: boolean;
}
