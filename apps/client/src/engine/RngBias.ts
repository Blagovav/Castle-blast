import type { Board } from './Board.js';
import type { TileType } from './types.js';
import { MatchDetector } from './MatchDetector.js';

export class RngBias {
  private matchDetector: MatchDetector;

  constructor(matchDetector: MatchDetector) {
    this.matchDetector = matchDetector;
  }

  /** Get a biased tile type that increases the chance of near-matches.
   *  Called when player has few moves left and hasn't reached the objective.
   *  Returns undefined if no bias should be applied.
   */
  getBiasedType(board: Board, movesLeft: number, threshold: number): TileType | undefined {
    if (movesLeft > threshold) return undefined;

    // Count tile types on the board to find the most common ones
    const counts = new Map<number, number>();
    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        const tile = board.getTile(row, col);
        if (tile) {
          counts.set(tile.type, (counts.get(tile.type) ?? 0) + 1);
        }
      }
    }

    // Find tile types that appear in pairs (2 adjacent) — biasing toward these
    // increases chance of creating a matchable 3rd tile
    const pairTypes = this.findNearMatchTypes(board);

    if (pairTypes.length > 0) {
      // 60% chance to use a biased type
      if (Math.random() < 0.6) {
        return pairTypes[Math.floor(Math.random() * pairTypes.length)];
      }
    }

    return undefined;
  }

  /** Find tile types that currently have pairs (2 in a row/column) */
  private findNearMatchTypes(board: Board): TileType[] {
    const types = new Set<TileType>();

    // Horizontal pairs
    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width - 1; col++) {
        const a = board.getTile(row, col);
        const b = board.getTile(row, col + 1);
        if (a && b && a.type === b.type) {
          types.add(a.type);
        }
      }
    }

    // Vertical pairs
    for (let col = 0; col < board.width; col++) {
      for (let row = 0; row < board.height - 1; row++) {
        const a = board.getTile(row, col);
        const b = board.getTile(row + 1, col);
        if (a && b && a.type === b.type) {
          types.add(a.type);
        }
      }
    }

    return [...types];
  }
}
