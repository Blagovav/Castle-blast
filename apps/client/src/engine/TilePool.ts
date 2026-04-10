import { Sprite, Texture, Graphics, Container } from 'pixi.js';
import type { TileType, SpecialType } from './types.js';

const TILE_SPRITE_PATHS: Record<TileType, string> = {
  0: '/sprites/tile_0.png',
  1: '/sprites/tile_1.png',
  2: '/sprites/tile_2.png',
  3: '/sprites/tile_3.png',
  4: '/sprites/tile_4.png',
};

const SPECIAL_SPRITE_PATHS: Record<string, string> = {
  rocket_h: '/sprites/special_rocket_h.png',
  rocket_v: '/sprites/special_rocket_v.png',
  bomb: '/sprites/special_bomb.png',
};

// Fallback colors if sprites haven't loaded
const TILE_COLORS: Record<TileType, number> = {
  0: 0xff4444,
  1: 0x44bb44,
  2: 0x4488ff,
  3: 0xffaa00,
  4: 0xcc44cc,
};

export class TilePool {
  private pool: Container[] = [];
  private active: Set<Container> = new Set();
  private tileSize: number;
  private texturesLoaded: boolean = false;
  private tileTextures: Map<string, Texture> = new Map();

  constructor(tileSize: number, preAllocate: number = 100) {
    this.tileSize = tileSize;
    this.loadTextures();
  }

  private async loadTextures(): Promise<void> {
    try {
      // Pre-load all tile textures
      for (const [type, path] of Object.entries(TILE_SPRITE_PATHS)) {
        const tex = await Texture.from(path);
        this.tileTextures.set(`tile_${type}`, tex);
      }
      for (const [special, path] of Object.entries(SPECIAL_SPRITE_PATHS)) {
        const tex = await Texture.from(path);
        this.tileTextures.set(`special_${special}`, tex);
      }
      this.texturesLoaded = true;
    } catch {
      // Sprites not available — fallback to graphics
      this.texturesLoaded = false;
    }
  }

  /** Get a tile visual from the pool */
  acquire(type: TileType, special: SpecialType = 'none'): Container {
    const container = new Container();
    this.active.add(container);
    this.drawTile(container, type, special);
    container.visible = true;
    return container;
  }

  /** Return a tile to the pool */
  release(container: Container): void {
    if (!this.active.has(container)) return;
    this.active.delete(container);
    container.visible = false;
    container.removeFromParent();
    container.removeChildren();
  }

  /** Release all active tiles */
  releaseAll(): void {
    for (const c of this.active) {
      c.visible = false;
      c.removeFromParent();
      c.removeChildren();
    }
    this.active.clear();
  }

  private drawTile(container: Container, type: TileType, special: SpecialType): void {
    const size = this.tileSize;
    const padding = 2;

    container.removeChildren();

    // Try sprite-based rendering first
    const tileTexKey = `tile_${type}`;
    const tileTex = this.tileTextures.get(tileTexKey);

    if (tileTex && this.texturesLoaded) {
      // Sprite-based tile
      const sprite = new Sprite(tileTex);
      sprite.width = size - padding * 2;
      sprite.height = size - padding * 2;
      sprite.position.set(-(size - padding * 2) / 2, -(size - padding * 2) / 2);
      container.addChild(sprite);

      // Special overlay
      if (special !== 'none') {
        const specialTexKey = `special_${special}`;
        const specialTex = this.tileTextures.get(specialTexKey);
        if (specialTex) {
          const overlay = new Sprite(specialTex);
          overlay.width = size * 0.5;
          overlay.height = size * 0.5;
          overlay.position.set(-size * 0.25, -size * 0.25);
          overlay.alpha = 0.85;
          container.addChild(overlay);
        }
      }
    } else {
      // Fallback: colored rounded rectangles
      const g = new Graphics();
      const color = TILE_COLORS[type];
      const radius = 8;

      g.roundRect(-size / 2 + padding, -size / 2 + padding, size - padding * 2, size - padding * 2, radius);
      g.fill({ color });

      // Inner highlight
      g.roundRect(-size / 2 + padding + 3, -size / 2 + padding + 3, size - padding * 2 - 6, (size - padding * 2) * 0.35, radius - 2);
      g.fill({ color: 0xffffff, alpha: 0.3 });

      container.addChild(g);

      // Special indicator
      if (special !== 'none') {
        const sg = new Graphics();
        const cx = 0;
        const cy = 0;

        if (special === 'rocket_h') {
          sg.moveTo(cx - 10, cy);
          sg.lineTo(cx + 10, cy);
          sg.moveTo(cx + 6, cy - 4);
          sg.lineTo(cx + 10, cy);
          sg.lineTo(cx + 6, cy + 4);
          sg.stroke({ color: 0xffffff, width: 3 });
        } else if (special === 'rocket_v') {
          sg.moveTo(cx, cy - 10);
          sg.lineTo(cx, cy + 10);
          sg.moveTo(cx - 4, cy + 6);
          sg.lineTo(cx, cy + 10);
          sg.lineTo(cx + 4, cy + 6);
          sg.stroke({ color: 0xffffff, width: 3 });
        } else if (special === 'bomb') {
          sg.circle(cx, cy, 8);
          sg.fill({ color: 0xffffff, alpha: 0.7 });
        }

        container.addChild(sg);
      }
    }
  }

  get tilePixelSize(): number {
    return this.tileSize;
  }
}
