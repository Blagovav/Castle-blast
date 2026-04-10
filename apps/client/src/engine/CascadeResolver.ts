import type { Board } from './Board.js';
import { MatchDetector } from './MatchDetector.js';
import type { CascadeStep, GridPos, Tile, TileType } from './types.js';

export class CascadeResolver {
  private matchDetector: MatchDetector;

  constructor(matchDetector: MatchDetector) {
    this.matchDetector = matchDetector;
  }

  /** Resolve all cascades after a match.
   *  Returns an array of steps (each step = one cascade tick).
   *  The caller should animate each step sequentially.
   */
  resolve(board: Board, biasedType?: TileType): CascadeStep[] {
    const steps: CascadeStep[] = [];

    let matches = this.matchDetector.findMatches(board);

    while (matches.length > 0) {
      const step: CascadeStep = {
        removed: [],
        fallen: [],
        spawned: [],
        specialsCreated: [],
        specialsActivated: [],
      };

      // Determine specials from matches
      const intersections = this.matchDetector.detectIntersections(matches);

      // Mark intersection points as bomb creation
      for (const pos of intersections) {
        step.specialsCreated.push({ pos, special: 'bomb' });
      }

      // For non-intersection matches, check if they warrant a special
      const intersectionSet = new Set(intersections.map(p => `${p.row},${p.col}`));

      for (const match of matches) {
        const special = this.matchDetector.determineSpecial(match);
        if (special !== 'none') {
          // Place special at the middle of the match (or swap position if available)
          const midIdx = Math.floor(match.positions.length / 2);
          const pos = match.positions[midIdx];
          const key = `${pos.row},${pos.col}`;
          if (!intersectionSet.has(key)) {
            step.specialsCreated.push({ pos, special });
          }
        }
      }

      // Collect all positions to remove
      const allPositions = this.matchDetector.getUniquePositions(matches);

      // Check for special tile activations in the matched positions
      for (const pos of allPositions) {
        const tile = board.getTile(pos.row, pos.col);
        if (tile && tile.special !== 'none') {
          const affected = this.getSpecialAffected(board, pos, tile.special);
          step.specialsActivated.push({ pos, special: tile.special, affected });
          // Add affected positions to removal list
          for (const ap of affected) {
            const key = `${ap.row},${ap.col}`;
            if (!allPositions.find(p => p.row === ap.row && p.col === ap.col)) {
              allPositions.push(ap);
            }
          }
        }
      }

      step.removed = [...allPositions];

      // Create specials before removing tiles
      const specialPositions = new Set<string>();
      for (const { pos, special } of step.specialsCreated) {
        const tile = board.getTile(pos.row, pos.col);
        if (tile) {
          board.setTile(pos.row, pos.col, { type: tile.type, special });
          specialPositions.add(`${pos.row},${pos.col}`);
        }
      }

      // Remove tiles (except newly created specials)
      for (const pos of allPositions) {
        const key = `${pos.row},${pos.col}`;
        if (!specialPositions.has(key)) {
          board.removeTiles([pos]);
        }
      }

      // Apply gravity
      step.fallen = board.applyGravity();

      // Fill empty cells
      step.spawned = board.fillEmpty(biasedType);

      steps.push(step);

      // Check for new matches (cascade)
      matches = this.matchDetector.findMatches(board);
    }

    return steps;
  }

  /** Get positions affected by a special tile activation */
  private getSpecialAffected(board: Board, pos: GridPos, special: string): GridPos[] {
    const affected: GridPos[] = [];

    switch (special) {
      case 'rocket_h':
        // Clear entire row
        for (let col = 0; col < board.width; col++) {
          if (board.isActive(pos.row, col) && col !== pos.col) {
            affected.push({ row: pos.row, col });
          }
        }
        break;

      case 'rocket_v':
        // Clear entire column
        for (let row = 0; row < board.height; row++) {
          if (board.isActive(row, pos.col) && row !== pos.row) {
            affected.push({ row, col: pos.col });
          }
        }
        break;

      case 'bomb':
        // Clear 3x3 area
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = pos.row + dr;
            const c = pos.col + dc;
            if (board.isActive(r, c) && !(dr === 0 && dc === 0)) {
              affected.push({ row: r, col: c });
            }
          }
        }
        break;
    }

    return affected;
  }
}
