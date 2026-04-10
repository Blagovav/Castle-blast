import type { Board } from './Board.js';
import type { GridPos, SpecialType } from './types.js';

export class SpecialTileLogic {
  /** Activate a special tile at the given position.
   *  Returns all positions that should be cleared.
   */
  activate(board: Board, pos: GridPos): GridPos[] {
    const tile = board.getTile(pos.row, pos.col);
    if (!tile || tile.special === 'none') return [];

    const affected: GridPos[] = [];

    switch (tile.special) {
      case 'rocket_h':
        for (let col = 0; col < board.width; col++) {
          if (board.isActive(pos.row, col)) {
            affected.push({ row: pos.row, col });
          }
        }
        break;

      case 'rocket_v':
        for (let row = 0; row < board.height; row++) {
          if (board.isActive(row, pos.col)) {
            affected.push({ row, col: pos.col });
          }
        }
        break;

      case 'bomb':
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = pos.row + dr;
            const c = pos.col + dc;
            if (board.isActive(r, c)) {
              affected.push({ row: r, col: c });
            }
          }
        }
        break;
    }

    return affected;
  }

  /** Handle combo when two special tiles are swapped together */
  combo(board: Board, posA: GridPos, posB: GridPos): GridPos[] {
    const tileA = board.getTile(posA.row, posA.col);
    const tileB = board.getTile(posB.row, posB.col);

    if (!tileA || !tileB) return [];
    if (tileA.special === 'none' || tileB.special === 'none') return [];

    const specials = new Set([tileA.special, tileB.special]);
    const affected: GridPos[] = [];

    if (specials.has('bomb') && specials.size === 1) {
      // Bomb + Bomb = 5x5 area from midpoint
      const midRow = Math.round((posA.row + posB.row) / 2);
      const midCol = Math.round((posA.col + posB.col) / 2);
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const r = midRow + dr;
          const c = midCol + dc;
          if (board.isActive(r, c)) {
            affected.push({ row: r, col: c });
          }
        }
      }
    } else if (specials.has('bomb')) {
      // Bomb + Rocket = clear row AND column AND 3x3
      const rocketPos = tileA.special.startsWith('rocket') ? posA : posB;
      const bombPos = tileA.special === 'bomb' ? posA : posB;

      // Row + Column cross
      for (let col = 0; col < board.width; col++) {
        if (board.isActive(rocketPos.row, col)) affected.push({ row: rocketPos.row, col });
      }
      for (let row = 0; row < board.height; row++) {
        if (board.isActive(row, rocketPos.col)) affected.push({ row, col: rocketPos.col });
      }
      // 3x3 around bomb
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = bombPos.row + dr;
          const c = bombPos.col + dc;
          if (board.isActive(r, c)) affected.push({ row: r, col: c });
        }
      }
    } else {
      // Rocket + Rocket = clear row AND column (cross)
      const row = posA.row;
      const col = posA.col;
      for (let c = 0; c < board.width; c++) {
        if (board.isActive(row, c)) affected.push({ row, col: c });
      }
      for (let r = 0; r < board.height; r++) {
        if (board.isActive(r, col)) affected.push({ row: r, col });
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return affected.filter(p => {
      const key = `${p.row},${p.col}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
