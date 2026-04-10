import type { Board } from './Board.js';
import { MatchDetector } from './MatchDetector.js';

export class DeadBoardDetector {
  private matchDetector: MatchDetector;

  constructor(matchDetector: MatchDetector) {
    this.matchDetector = matchDetector;
  }

  /** Check if any valid move exists on the board.
   *  A valid move is a swap of two adjacent active tiles that creates at least one match.
   */
  hasValidMoves(board: Board): boolean {
    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        if (!board.isActive(row, col) || !board.getTile(row, col)) continue;

        // Check right neighbor
        if (col + 1 < board.width && board.isActive(row, col + 1) && board.getTile(row, col + 1)) {
          board.swap({ row, col }, { row, col: col + 1 });
          const has = this.matchDetector.hasMatches(board);
          board.swap({ row, col }, { row, col: col + 1 }); // swap back
          if (has) return true;
        }

        // Check bottom neighbor
        if (row + 1 < board.height && board.isActive(row + 1, col) && board.getTile(row + 1, col)) {
          board.swap({ row, col }, { row: row + 1, col });
          const has = this.matchDetector.hasMatches(board);
          board.swap({ row, col }, { row: row + 1, col }); // swap back
          if (has) return true;
        }
      }
    }

    return false;
  }

  /** Reshuffle the board until valid moves exist.
   *  Preserves blocked cells and special tiles.
   */
  reshuffle(board: Board): void {
    const activeCells = board.getActiveCells();
    let attempts = 0;
    const maxAttempts = 100;

    do {
      // Collect all tiles
      const tiles = activeCells
        .map(pos => board.getTile(pos.row, pos.col)!)
        .filter(Boolean);

      // Fisher-Yates shuffle
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }

      // Place back
      for (let i = 0; i < activeCells.length; i++) {
        board.setTile(activeCells[i].row, activeCells[i].col, tiles[i]);
      }

      attempts++;
    } while (
      (this.matchDetector.hasMatches(board) || !this.hasValidMoves(board)) &&
      attempts < maxAttempts
    );
  }
}
