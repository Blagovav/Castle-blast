import { Container, Graphics } from 'pixi.js';
import type { Board } from './Board.js';
import { TilePool } from './TilePool.js';
import type { GridPos, TileType, SpecialType } from './types.js';

export class BoardRenderer {
  readonly container: Container;
  readonly tileContainer: Container;
  readonly effectsContainer: Container;
  private tilePool: TilePool;
  private tileSprites: Map<string, Graphics> = new Map();
  private board: Board;
  private tileSize: number;
  private offsetX: number;
  private offsetY: number;

  constructor(board: Board, canvasWidth: number, canvasHeight: number) {
    this.board = board;
    this.container = new Container();
    this.tileContainer = new Container();
    this.effectsContainer = new Container();

    this.container.addChild(this.tileContainer);
    this.container.addChild(this.effectsContainer);

    // Calculate tile size to fit the board in canvas
    const maxTileW = Math.floor((canvasWidth - 20) / board.width);
    const maxTileH = Math.floor((canvasHeight - 20) / board.height);
    this.tileSize = Math.min(maxTileW, maxTileH, 56);

    // Center the board
    const boardPixelW = board.width * this.tileSize;
    const boardPixelH = board.height * this.tileSize;
    this.offsetX = Math.floor((canvasWidth - boardPixelW) / 2);
    this.offsetY = Math.floor((canvasHeight - boardPixelH) / 2);

    this.container.position.set(this.offsetX, this.offsetY);

    this.tilePool = new TilePool(this.tileSize);

    // Draw background cells
    this.drawBackground();

    // Render initial tiles
    this.renderAll();
  }

  private drawBackground(): void {
    const bg = new Graphics();

    for (let row = 0; row < this.board.height; row++) {
      for (let col = 0; col < this.board.width; col++) {
        if (this.board.isActive(row, col)) {
          const x = col * this.tileSize;
          const y = row * this.tileSize;
          bg.roundRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2, 6);
          bg.fill({ color: 0x2a2a4a, alpha: 0.5 });
        }
      }
    }

    this.container.addChildAt(bg, 0);
  }

  /** Render all tiles from current board state */
  renderAll(): void {
    // Release all existing sprites
    for (const [, sprite] of this.tileSprites) {
      this.tilePool.release(sprite);
    }
    this.tileSprites.clear();

    for (let row = 0; row < this.board.height; row++) {
      for (let col = 0; col < this.board.width; col++) {
        const tile = this.board.getTile(row, col);
        if (tile) {
          this.addTileSprite(row, col, tile.type, tile.special);
        }
      }
    }
  }

  /** Add a tile sprite at grid position */
  addTileSprite(row: number, col: number, type: TileType, special: SpecialType = 'none'): Graphics {
    const sprite = this.tilePool.acquire(type, special);
    const { x, y } = this.gridToPixel(row, col);
    sprite.position.set(x, y);
    this.tileContainer.addChild(sprite);
    this.tileSprites.set(this.key(row, col), sprite);
    return sprite;
  }

  /** Remove a tile sprite */
  removeTileSprite(row: number, col: number): Graphics | undefined {
    const k = this.key(row, col);
    const sprite = this.tileSprites.get(k);
    if (sprite) {
      this.tileSprites.delete(k);
      this.tilePool.release(sprite);
    }
    return sprite;
  }

  /** Get the sprite at a grid position */
  getTileSprite(row: number, col: number): Graphics | undefined {
    return this.tileSprites.get(this.key(row, col));
  }

  /** Move sprite key from one position to another (after gravity) */
  moveSpriteKey(fromRow: number, fromCol: number, toRow: number, toCol: number): void {
    const fromKey = this.key(fromRow, fromCol);
    const toKey = this.key(toRow, toCol);
    const sprite = this.tileSprites.get(fromKey);
    if (sprite) {
      this.tileSprites.delete(fromKey);
      this.tileSprites.set(toKey, sprite);
    }
  }

  /** Convert grid position to pixel coordinates (center of tile) */
  gridToPixel(row: number, col: number): { x: number; y: number } {
    return {
      x: col * this.tileSize + this.tileSize / 2,
      y: row * this.tileSize + this.tileSize / 2,
    };
  }

  /** Convert pixel coordinates to grid position */
  pixelToGrid(px: number, py: number): GridPos | null {
    // Adjust for container offset
    const localX = px - this.offsetX;
    const localY = py - this.offsetY;

    const col = Math.floor(localX / this.tileSize);
    const row = Math.floor(localY / this.tileSize);

    if (row >= 0 && row < this.board.height && col >= 0 && col < this.board.width && this.board.isActive(row, col)) {
      return { row, col };
    }

    return null;
  }

  private key(row: number, col: number): string {
    return `${row},${col}`;
  }

  get pixelTileSize(): number {
    return this.tileSize;
  }

  destroy(): void {
    this.tilePool.releaseAll();
    this.tileSprites.clear();
    this.container.destroy({ children: true });
  }
}
