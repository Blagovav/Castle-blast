import { Graphics, Container, type ContainerChild } from 'pixi.js';
import type { TileType, SpecialType } from './types.js';

const TILE_COLORS: Record<TileType, number> = {
  0: 0xff4444, // Red
  1: 0x44bb44, // Green
  2: 0x4488ff, // Blue
  3: 0xffaa00, // Orange
  4: 0xcc44cc, // Purple
};

export class TilePool {
  private pool: Graphics[] = [];
  private active: Set<Graphics> = new Set();
  private tileSize: number;

  constructor(tileSize: number, preAllocate: number = 100) {
    this.tileSize = tileSize;

    for (let i = 0; i < preAllocate; i++) {
      this.pool.push(this.createGraphics());
    }
  }

  private createGraphics(): Graphics {
    return new Graphics();
  }

  /** Get a tile sprite from the pool */
  acquire(type: TileType, special: SpecialType = 'none'): Graphics {
    const g = this.pool.pop() ?? this.createGraphics();
    this.active.add(g);
    this.drawTile(g, type, special);
    g.visible = true;
    return g;
  }

  /** Return a tile sprite to the pool */
  release(g: Graphics): void {
    if (!this.active.has(g)) return;
    this.active.delete(g);
    g.visible = false;
    g.removeFromParent();
    g.clear();
    this.pool.push(g);
  }

  /** Release all active sprites */
  releaseAll(): void {
    for (const g of this.active) {
      g.visible = false;
      g.removeFromParent();
      g.clear();
      this.pool.push(g);
    }
    this.active.clear();
  }

  /** Update tile appearance (e.g., when special changes) */
  updateTile(g: Graphics, type: TileType, special: SpecialType): void {
    this.drawTile(g, type, special);
  }

  private drawTile(g: Graphics, type: TileType, special: SpecialType): void {
    const size = this.tileSize;
    const padding = 2;
    const radius = 8;
    const color = TILE_COLORS[type];

    g.clear();

    // Base tile
    g.roundRect(padding, padding, size - padding * 2, size - padding * 2, radius);
    g.fill({ color });

    // Inner highlight
    g.roundRect(padding + 3, padding + 3, size - padding * 2 - 6, (size - padding * 2) * 0.4, radius - 2);
    g.fill({ color: 0xffffff, alpha: 0.25 });

    // Special indicator
    if (special === 'rocket_h' || special === 'rocket_v') {
      const cx = size / 2;
      const cy = size / 2;
      if (special === 'rocket_h') {
        // Horizontal arrow
        g.moveTo(cx - 10, cy);
        g.lineTo(cx + 10, cy);
        g.moveTo(cx + 6, cy - 4);
        g.lineTo(cx + 10, cy);
        g.lineTo(cx + 6, cy + 4);
        g.stroke({ color: 0xffffff, width: 2 });
      } else {
        // Vertical arrow
        g.moveTo(cx, cy - 10);
        g.lineTo(cx, cy + 10);
        g.moveTo(cx - 4, cy + 6);
        g.lineTo(cx, cy + 10);
        g.lineTo(cx + 4, cy + 6);
        g.stroke({ color: 0xffffff, width: 2 });
      }
    } else if (special === 'bomb') {
      // Star/explosion shape
      const cx = size / 2;
      const cy = size / 2;
      g.star(cx, cy, 6, 5, 10);
      g.fill({ color: 0xffffff, alpha: 0.7 });
    }

    // Set pivot to center
    g.pivot.set(size / 2, size / 2);
  }

  get tilePixelSize(): number {
    return this.tileSize;
  }
}
