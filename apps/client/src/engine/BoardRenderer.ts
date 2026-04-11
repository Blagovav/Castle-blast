import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { Board } from './Board.js';
import { TilePool } from './TilePool.js';
import type { GridPos, TileType, SpecialType, BiomeConfig } from './types.js';
import { BIOMES } from './Biomes.js';

export class BoardRenderer {
  readonly container: Container;
  readonly tileContainer: Container;
  readonly effectsContainer: Container;
  private bgContainer: Container;
  private tilePool: TilePool;
  private tileSprites: Map<string, Container> = new Map();
  private board: Board;
  private biome: BiomeConfig;
  private tileSize: number;
  private offsetX: number;
  private offsetY: number;

  constructor(board: Board, canvasWidth: number, canvasHeight: number, biome: BiomeConfig = BIOMES.castle) {
    this.board = board;
    this.biome = biome;
    this.container = new Container();
    this.bgContainer = new Container();
    this.tileContainer = new Container();
    this.effectsContainer = new Container();

    this.container.addChild(this.bgContainer);
    this.container.addChild(this.tileContainer);
    this.container.addChild(this.effectsContainer);

    // Calculate tile size to fit the board
    const maxTileW = Math.floor((canvasWidth - 16) / board.width);
    const maxTileH = Math.floor((canvasHeight - 16) / board.height);
    this.tileSize = Math.min(maxTileW, maxTileH, 60);

    // Center the board
    const boardPixelW = board.width * this.tileSize;
    const boardPixelH = board.height * this.tileSize;
    this.offsetX = Math.floor((canvasWidth - boardPixelW) / 2);
    this.offsetY = Math.floor((canvasHeight - boardPixelH) / 2);

    this.container.position.set(this.offsetX, this.offsetY);

    this.tilePool = new TilePool(this.tileSize);

    this.drawBackground();
    // Don't render tiles yet — call preloadAndRender() after construction
  }

  /** Preload sprite textures then render the board */
  async preloadAndRender(): Promise<void> {
    await this.tilePool.preload();
    this.renderAll();
  }

  private drawBackground(): void {
    const bg = new Graphics();
    const size = this.tileSize;

    for (let row = 0; row < this.board.height; row++) {
      for (let col = 0; col < this.board.width; col++) {
        const x = col * size;
        const y = row * size;

        if (this.board.isActive(row, col)) {
          // Active cell — checkerboard with biome colors
          const isLight = (row + col) % 2 === 0;
          bg.roundRect(x + 1, y + 1, size - 2, size - 2, 8);
          bg.fill({ color: isLight ? this.biome.cellColor1 : this.biome.cellColor2, alpha: 0.7 });
        } else if (this.board.cells[row][col] === 'blocked') {
          // Blocked cell — stone/wall block (VISIBLE) with biome color
          this.drawBlockedCell(bg, x, y, size);
        }
      }
    }

    this.bgContainer.addChild(bg);
  }

  /** Draw a stone block for blocked cells */
  private drawBlockedCell(g: Graphics, x: number, y: number, size: number): void {
    const bc = this.biome.blockedColor;
    const bh = this.biome.blockedHighlight;

    // Stone base
    g.roundRect(x + 1, y + 1, size - 2, size - 2, 6);
    g.fill({ color: bc });

    // Inner stone
    g.roundRect(x + 3, y + 3, size - 6, size - 6, 4);
    g.fill({ color: bc - 0x0a0a0a });

    // Crack lines
    g.moveTo(x + size * 0.3, y + 4);
    g.lineTo(x + size * 0.4, y + size * 0.5);
    g.lineTo(x + size * 0.25, y + size - 4);
    g.stroke({ color: bc - 0x151515, width: 1 });

    g.moveTo(x + size * 0.7, y + size * 0.2);
    g.lineTo(x + size * 0.6, y + size * 0.7);
    g.stroke({ color: bc - 0x151515, width: 1 });

    // Top highlight
    g.roundRect(x + 3, y + 3, size - 6, size * 0.25, 4);
    g.fill({ color: bh, alpha: 0.35 });
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
          this.addTileSprite(row, col, tile.type, tile.special, tile.blocker, tile.blockerHp);
        }
      }
    }
  }

  /** Add a tile sprite at grid position */
  addTileSprite(row: number, col: number, type: TileType, special: SpecialType = 'none', blocker: any = 'none', blockerHp: number = 0): Container {
    const sprite = this.tilePool.acquire(type, special, blocker, blockerHp);
    const { x, y } = this.gridToPixel(row, col);
    sprite.position.set(x, y);
    this.tileContainer.addChild(sprite);
    this.tileSprites.set(this.key(row, col), sprite);
    return sprite;
  }

  /** Remove a tile sprite */
  removeTileSprite(row: number, col: number): Container | undefined {
    const k = this.key(row, col);
    const sprite = this.tileSprites.get(k);
    if (sprite) {
      this.tileSprites.delete(k);
      this.tilePool.release(sprite);
    }
    return sprite;
  }

  /** Get the sprite at a grid position */
  getTileSprite(row: number, col: number): Container | undefined {
    return this.tileSprites.get(this.key(row, col));
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
