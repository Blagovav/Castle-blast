import { MIN_MATCH, ROCKET_MATCH } from '@castle-blast/shared';
import type { Board } from './Board.js';
import type { GridPos, MatchGroup, SpecialType } from './types.js';

export class MatchDetector {
  /** Find all matches (3+ in a row) on the board */
  findMatches(board: Board): MatchGroup[] {
    const matches: MatchGroup[] = [];

    // Horizontal matches
    for (let row = 0; row < board.height; row++) {
      let runStart = -1;
      let runType = -1;

      for (let col = 0; col <= board.width; col++) {
        const tile = col < board.width ? board.getTile(row, col) : null;
        const type = tile?.type ?? -1;

        if (type === runType && type !== -1 && board.isActive(row, col)) {
          continue;
        }

        // End of run
        if (runStart >= 0 && col - runStart >= MIN_MATCH) {
          const positions: GridPos[] = [];
          for (let c = runStart; c < col; c++) {
            positions.push({ row, col: c });
          }
          matches.push({ positions, isHorizontal: true });
        }

        runStart = board.isActive(row, col) && type !== -1 ? col : -1;
        runType = type;
      }
    }

    // Vertical matches
    for (let col = 0; col < board.width; col++) {
      let runStart = -1;
      let runType = -1;

      for (let row = 0; row <= board.height; row++) {
        const tile = row < board.height ? board.getTile(row, col) : null;
        const type = tile?.type ?? -1;

        if (type === runType && type !== -1 && board.isActive(row, col)) {
          continue;
        }

        // End of run
        if (runStart >= 0 && row - runStart >= MIN_MATCH) {
          const positions: GridPos[] = [];
          for (let r = runStart; r < row; r++) {
            positions.push({ row: r, col });
          }
          matches.push({ positions, isHorizontal: false });
        }

        runStart = board.isActive(row, col) && type !== -1 ? row : -1;
        runType = type;
      }
    }

    return matches;
  }

  /** Check if the board has any matches */
  hasMatches(board: Board): boolean {
    return this.findMatches(board).length > 0;
  }

  /** Merge overlapping matches and deduplicate positions */
  getUniquePositions(matches: MatchGroup[]): GridPos[] {
    const set = new Set<string>();
    const result: GridPos[] = [];

    for (const match of matches) {
      for (const pos of match.positions) {
        const key = `${pos.row},${pos.col}`;
        if (!set.has(key)) {
          set.add(key);
          result.push(pos);
        }
      }
    }

    return result;
  }

  /** Determine what special tile to create from a match group.
   *  - 4 in a row → rocket (direction based on match orientation)
   *  - T or L shape (detected via overlapping matches) → bomb
   *  - 5+ in a row → bomb
   */
  determineSpecial(match: MatchGroup): SpecialType {
    const len = match.positions.length;
    if (len >= 5) return 'bomb';
    if (len >= ROCKET_MATCH) {
      return match.isHorizontal ? 'rocket_v' : 'rocket_h';
    }
    return 'none';
  }

  /** Detect T/L shapes by finding intersecting horizontal+vertical matches */
  detectIntersections(matches: MatchGroup[]): GridPos[] {
    const hMatches = matches.filter(m => m.isHorizontal);
    const vMatches = matches.filter(m => !m.isHorizontal);
    const intersections: GridPos[] = [];

    for (const h of hMatches) {
      for (const v of vMatches) {
        // Find shared position
        for (const hp of h.positions) {
          for (const vp of v.positions) {
            if (hp.row === vp.row && hp.col === vp.col) {
              intersections.push(hp);
            }
          }
        }
      }
    }

    return intersections;
  }
}
