import type { LevelDefinition, LevelObjective as Objective } from '@castle-blast/shared';
import type { GridPos, TileType } from './types.js';

export class LevelObjectiveTracker {
  private objectives: Objective[];
  private progress: Map<string, number> = new Map();
  private starThresholds: [number, number, number];

  constructor(levelDef: LevelDefinition) {
    this.objectives = levelDef.objectives;
    this.starThresholds = levelDef.starThresholds;

    for (const obj of this.objectives) {
      const key = obj.tileType !== undefined ? `${obj.type}:${obj.tileType}` : obj.type;
      this.progress.set(key, 0);
    }
  }

  /** Record score points */
  addScore(points: number): void {
    const current = this.progress.get('score') ?? 0;
    this.progress.set('score', current + points);
  }

  /** Record collected tiles */
  addCollected(type: TileType, count: number): void {
    const key = `collect:${type}`;
    if (this.progress.has(key)) {
      const current = this.progress.get(key) ?? 0;
      this.progress.set(key, current + count);
    }
    // Also count toward generic collect if exists
    if (this.progress.has('collect')) {
      const current = this.progress.get('collect') ?? 0;
      this.progress.set('collect', current + count);
    }
  }

  /** Get current score */
  getScore(): number {
    return this.progress.get('score') ?? 0;
  }

  /** Check if all objectives are completed */
  isComplete(): boolean {
    for (const obj of this.objectives) {
      const key = obj.tileType !== undefined ? `${obj.type}:${obj.tileType}` : obj.type;
      const current = this.progress.get(key) ?? 0;
      if (current < obj.target) return false;
    }
    return true;
  }

  /** Calculate stars earned based on score */
  getStarsEarned(): number {
    const score = this.getScore();
    if (score >= this.starThresholds[2]) return 3;
    if (score >= this.starThresholds[1]) return 2;
    if (score >= this.starThresholds[0]) return 1;
    return 0;
  }

  /** Get progress for display */
  getProgressDisplay(): { type: string; current: number; target: number }[] {
    return this.objectives.map(obj => {
      const key = obj.tileType !== undefined ? `${obj.type}:${obj.tileType}` : obj.type;
      return {
        type: obj.type,
        current: this.progress.get(key) ?? 0,
        target: obj.target,
      };
    });
  }
}
