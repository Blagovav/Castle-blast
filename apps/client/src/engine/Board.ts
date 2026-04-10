import { GRID_WIDTH, GRID_HEIGHT, TILE_TYPES, MIN_MATCH } from '@castle-blast/shared';
import type { CellState, Tile, TileType, GridPos, SpecialType } from './types.js';

export class Board {
  readonly width: number;
  readonly height: number;
  readonly cells: CellState[][];
  readonly tiles: (Tile | null)[][];
  private tileTypeCount: number;

  constructor(
    width: number = GRID_WIDTH,
    height: number = GRID_HEIGHT,
    blocked: [number, number][] = [],
    tileTypes: number = TILE_TYPES,
  ) {
    this.width = width;
    this.height = height;
    this.tileTypeCount = tileTypes;

    // Initialize cell states
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => 'active' as CellState),
    );

    // Mark blocked cells
    for (const [col, row] of blocked) {
      if (row >= 0 && row < height && col >= 0 && col < width) {
        this.cells[row][col] = 'blocked';
      }
    }

    // Initialize tiles grid (null for blocked cells)
    this.tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null),
    );

    // Fill with random tiles ensuring no initial matches
    this.fillInitial();
  }

  isActive(row: number, col: number): boolean {
    return row >= 0 && row < this.height && col >= 0 && col < this.width && this.cells[row][col] === 'active';
  }

  getTile(row: number, col: number): Tile | null {
    if (!this.isActive(row, col)) return null;
    return this.tiles[row][col];
  }

  setTile(row: number, col: number, tile: Tile | null): void {
    if (this.isActive(row, col)) {
      this.tiles[row][col] = tile;
    }
  }

  randomTileType(): TileType {
    return Math.floor(Math.random() * this.tileTypeCount) as TileType;
  }

  createTile(type?: TileType, special: SpecialType = 'none'): Tile {
    return { type: type ?? this.randomTileType(), special };
  }

  /** Fill the board initially without creating any matches */
  private fillInitial(): void {
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (!this.isActive(row, col)) continue;

        let tile: Tile;
        let attempts = 0;
        do {
          tile = this.createTile();
          attempts++;
        } while (this.wouldMatch(row, col, tile.type) && attempts < 50);

        this.tiles[row][col] = tile;
      }
    }
  }

  /** Check if placing a tile type at (row, col) would create a match */
  private wouldMatch(row: number, col: number, type: TileType): boolean {
    // Check horizontal (look left)
    let hCount = 1;
    for (let c = col - 1; c >= 0 && this.isActive(row, c) && this.tiles[row][c]?.type === type; c--) {
      hCount++;
    }
    if (hCount >= MIN_MATCH) return true;

    // Check vertical (look up)
    let vCount = 1;
    for (let r = row - 1; r >= 0 && this.isActive(r, col) && this.tiles[r][col]?.type === type; r--) {
      vCount++;
    }
    if (vCount >= MIN_MATCH) return true;

    return false;
  }

  /** Check if two positions are adjacent (horizontally or vertically) */
  areAdjacent(a: GridPos, b: GridPos): boolean {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  /** Swap two tiles on the board */
  swap(a: GridPos, b: GridPos): void {
    const tileA = this.tiles[a.row][a.col];
    const tileB = this.tiles[b.row][b.col];
    this.tiles[a.row][a.col] = tileB;
    this.tiles[b.row][b.col] = tileA;
  }

  /** Apply gravity — tiles fall into empty active cells below them.
   *  Returns array of movements { from, to }
   */
  applyGravity(): { from: GridPos; to: GridPos }[] {
    const moves: { from: GridPos; to: GridPos }[] = [];

    for (let col = 0; col < this.width; col++) {
      // Process bottom to top
      let writeRow = this.height - 1;

      // Find the lowest active cell in this column
      while (writeRow >= 0 && !this.isActive(writeRow, col)) {
        writeRow--;
      }

      for (let readRow = writeRow; readRow >= 0; readRow--) {
        if (!this.isActive(readRow, col)) {
          // Hit a blocked cell — reset writeRow above it
          writeRow = readRow - 1;
          while (writeRow >= 0 && !this.isActive(writeRow, col)) {
            writeRow--;
          }
          continue;
        }

        if (this.tiles[readRow][col] !== null) {
          if (readRow !== writeRow) {
            this.tiles[writeRow][col] = this.tiles[readRow][col];
            this.tiles[readRow][col] = null;
            moves.push({ from: { row: readRow, col }, to: { row: writeRow, col } });
          }
          // Find next write position (going up, skip blocked)
          writeRow--;
          while (writeRow >= 0 && !this.isActive(writeRow, col)) {
            writeRow--;
          }
        }
      }
    }

    return moves;
  }

  /** Fill empty active cells from the top with new random tiles.
   *  Returns array of spawned tiles with positions.
   */
  fillEmpty(biasedType?: TileType): { pos: GridPos; tile: Tile }[] {
    const spawned: { pos: GridPos; tile: Tile }[] = [];

    for (let col = 0; col < this.width; col++) {
      for (let row = 0; row < this.height; row++) {
        if (this.isActive(row, col) && this.tiles[row][col] === null) {
          const tile = this.createTile(biasedType);
          this.tiles[row][col] = tile;
          spawned.push({ pos: { row, col }, tile });
        }
      }
    }

    return spawned;
  }

  /** Remove tiles at given positions, returns them */
  removeTiles(positions: GridPos[]): void {
    for (const { row, col } of positions) {
      this.tiles[row][col] = null;
    }
  }

  /** Get all active cell positions */
  getActiveCells(): GridPos[] {
    const cells: GridPos[] = [];
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (this.isActive(row, col)) {
          cells.push({ row, col });
        }
      }
    }
    return cells;
  }

  /** Clone the board for testing/simulation */
  clone(): Board {
    const blocked: [number, number][] = [];
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (this.cells[row][col] === 'blocked') {
          blocked.push([col, row]);
        }
      }
    }
    const board = new Board(this.width, this.height, blocked, this.tileTypeCount);
    // Copy tiles
    for (let row = 0; row < this.height; row++) {
      for (let col = 0; col < this.width; col++) {
        if (this.tiles[row][col]) {
          board.tiles[row][col] = { ...this.tiles[row][col]! };
        } else {
          board.tiles[row][col] = null;
        }
      }
    }
    return board;
  }
}
