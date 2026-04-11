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

    // Calculate tile size
    const maxTileW = Math.floor((canvasWidth - 24) / board.width);
    const maxTileH = Math.floor((canvasHeight - 24) / board.height);
    this.tileSize = Math.min(maxTileW, maxTileH, 58);

    // Center the board
    const boardPixelW = board.width * this.tileSize;
    const boardPixelH = board.height * this.tileSize;
    this.offsetX = Math.floor((canvasWidth - boardPixelW) / 2);
    this.offsetY = Math.floor((canvasHeight - boardPixelH) / 2);

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

    // Gold frame behind the board
    const frame = new Graphics();
    frame.roundRect(-6, -6, boardW + 12, boardH + 12, 12);
    frame.fill({ color: 0xc8960a }); // dark gold
    frame.roundRect(-4, -4, boardW + 8, boardH + 8, 10);
    frame.fill({ color: 0xe8b810 }); // bright gold
    frame.roundRect(-2, -2, boardW + 4, boardH + 4, 8);
    frame.fill({ color: 0xf0d040 }); // light gold highlight
    this.bgContainer.addChild(frame);

    // Cell backgrounds
    const bg = new Graphics();
    for (let row = 0; row < this.board.height; row++) {
      for (let col = 0; col < this.board.width; col++) {
        const x = col * size;
        const y = row * size;

        if (this.board.isActive(row, col)) {
          const isLight = (row + col) % 2 === 0;
          bg.roundRect(x + 0.5, y + 0.5, size - 1, size - 1, 4);
          bg.fill({ color: isLight ? this.biome.cellColor1 : this.biome.cellColor2 });
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
