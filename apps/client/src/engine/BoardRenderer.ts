import { Container, Graphics } from 'pixi.js';
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

    // Calculate tile size — fill as much width as possible
    const maxTileW = Math.floor((canvasWidth - 12) / board.width);
    const maxTileH = Math.floor((canvasHeight - 12) / board.height);
    this.tileSize = Math.min(maxTileW, maxTileH, 60);

    // Position board — center horizontally, push toward bottom
    const boardPixelW = board.width * this.tileSize;
    const boardPixelH = board.height * this.tileSize;
    this.offsetX = Math.floor((canvasWidth - boardPixelW) / 2);
    // Board starts near top of canvas — no empty space
    this.offsetY = 4;

    this.container.position.set(this.offsetX, this.offsetY);
    this.tilePool = new TilePool(this.tileSize);

    this.drawBackground();
  }

  async preloadAndRender(): Promise<void> {
    await this.tilePool.preload();
    this.renderAll();
  }

  private drawBackground(): void {
    const size = this.tileSize;
    const boardW = this.board.width * size;
    const boardH = this.board.height * size;

    // Thick gold frame behind the board (Royal Match style)
    const frame = new Graphics();
    // Outer shadow
    frame.roundRect(-10, -10, boardW + 20, boardH + 20, 16);
    frame.fill({ color: 0x8a6808, alpha: 0.6 });
    // Dark gold border
    frame.roundRect(-8, -8, boardW + 16, boardH + 16, 14);
    frame.fill({ color: 0xb08010 });
    // Bright gold
    frame.roundRect(-5, -5, boardW + 10, boardH + 10, 11);
    frame.fill({ color: 0xd8a818 });
    // Inner gold highlight
    frame.roundRect(-3, -3, boardW + 6, boardH + 6, 9);
    frame.fill({ color: 0xf0c830 });
    // Inner edge
    frame.roundRect(-1, -1, boardW + 2, boardH + 2, 7);
    frame.fill({ color: 0xe0b820 });
    this.bgContainer.addChild(frame);

    // No brick wall — transparent canvas, CSS background image shows through

    // Cell backgrounds
    const bg = new Graphics();
    for (let row = 0; row < this.board.height; row++) {
      for (let col = 0; col < this.board.width; col++) {
        const x = col * size;
        const y = row * size;

        if (this.board.isActive(row, col)) {
          const isLight = (row + col) % 2 === 0;
          // Seamless cells — no gap, subtle checkerboard
          bg.rect(x, y, size, size);
          bg.fill({ color: isLight ? this.biome.cellColor1 : this.biome.cellColor2 });
          // Thin grid line
          bg.rect(x, y + size - 0.5, size, 0.5);
          bg.fill({ color: 0x000000, alpha: 0.06 });
          bg.rect(x + size - 0.5, y, 0.5, size);
          bg.fill({ color: 0x000000, alpha: 0.06 });
        } else if (this.board.cells[row][col] === 'blocked') {
          this.drawBlockedCell(bg, x, y, size);
        }
      }
    }
    this.bgContainer.addChild(bg);
  }

  private drawBlockedCell(g: Graphics, x: number, y: number, size: number): void {
    const bc = this.biome.blockedColor;
    const bh = this.biome.blockedHighlight;

    // Stone block
    g.roundRect(x + 0.5, y + 0.5, size - 1, size - 1, 4);
    g.fill({ color: bc });

    // Brick pattern
    g.roundRect(x + 2, y + 2, size - 4, size * 0.4, 3);
    g.fill({ color: bh, alpha: 0.3 });

    // Cracks
    g.moveTo(x + size * 0.35, y + 3);
    g.lineTo(x + size * 0.4, y + size * 0.5);
    g.lineTo(x + size * 0.3, y + size - 3);
    g.stroke({ color: bc - 0x151515, width: 1 });
    g.moveTo(x + size * 0.65, y + size * 0.2);
    g.lineTo(x + size * 0.55, y + size * 0.7);
    g.stroke({ color: bc - 0x151515, width: 1 });
  }

  renderAll(): void {
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

  addTileSprite(row: number, col: number, type: TileType, special: SpecialType = 'none', blocker: any = 'none', blockerHp: number = 0): Container {
    const sprite = this.tilePool.acquire(type, special, blocker, blockerHp);
    const { x, y } = this.gridToPixel(row, col);
    sprite.position.set(x, y);
    this.tileContainer.addChild(sprite);
    this.tileSprites.set(this.key(row, col), sprite);
    return sprite;
  }

  removeTileSprite(row: number, col: number): Container | undefined {
    const k = this.key(row, col);
    const sprite = this.tileSprites.get(k);
    if (sprite) {
      this.tileSprites.delete(k);
      this.tilePool.release(sprite);
    }
    return sprite;
  }

  getTileSprite(row: number, col: number): Container | undefined {
    return this.tileSprites.get(this.key(row, col));
  }

  gridToPixel(row: number, col: number): { x: number; y: number } {
    return {
      x: col * this.tileSize + this.tileSize / 2,
      y: row * this.tileSize + this.tileSize / 2,
    };
  }

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
