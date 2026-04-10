import { Sprite, Texture, Graphics, Container, Assets } from 'pixi.js';
import type { TileType, SpecialType } from './types.js';

const TILE_SPRITE_PATHS: Record<number, string> = {
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

const TILE_COLORS: Record<TileType, number> = {
  0: 0xff4444,
  1: 0x44bb44,
  2: 0x4488ff,
  3: 0xffaa00,
  4: 0xcc44cc,
};

export class TilePool {
  private active: Set<Container> = new Set();
  private tileSize: number;
  private tileTextures: Map<string, Texture> = new Map();
  private _ready: boolean = false;

  constructor(tileSize: number) {
    this.tileSize = tileSize;
  }

  /** Preload all textures — MUST be awaited before using acquire() */
  async preload(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [type, path] of Object.entries(TILE_SPRITE_PATHS)) {
      promises.push(
        Assets.load(path)
          .then((tex: Texture) => { this.tileTextures.set(`tile_${type}`, tex); })
          .catch(() => { /* sprite missing, will use fallback */ })
      );
    }

    for (const [special, path] of Object.entries(SPECIAL_SPRITE_PATHS)) {
      promises.push(
        Assets.load(path)
          .then((tex: Texture) => { this.tileTextures.set(`special_${special}`, tex); })
          .catch(() => {})
      );
    }

    await Promise.all(promises);
    this._ready = true;
  }

  get ready(): boolean {
    return this._ready;
  }

  /** Get a tile visual */
  acquire(type: TileType, special: SpecialType = 'none'): Container {
    const container = new Container();
    this.active.add(container);
    this.drawTile(container, type, special);
    container.visible = true;
    return container;
  }

  release(container: Container): void {
    if (!this.active.has(container)) return;
    this.active.delete(container);
    container.visible = false;
    container.removeFromParent();
    container.removeChildren();
  }

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
    const innerSize = size - 2;

    container.removeChildren();

    const tileTex = this.tileTextures.get(`tile_${type}`);

    // Draw polished colored gem tile
    const g = new Graphics();
    const color = TILE_COLORS[type];
    const r = 10;

    // Base tile with gradient-like effect
    g.roundRect(-innerSize / 2, -innerSize / 2, innerSize, innerSize, r);
    g.fill({ color });

    // Top highlight (glossy shine)
    g.roundRect(-innerSize / 2 + 3, -innerSize / 2 + 3, innerSize - 6, innerSize * 0.35, r - 2);
    g.fill({ color: 0xffffff, alpha: 0.35 });

    // Bottom shadow
    g.roundRect(-innerSize / 2 + 2, innerSize / 2 - innerSize * 0.2, innerSize - 4, innerSize * 0.15, r - 2);
    g.fill({ color: 0x000000, alpha: 0.15 });

    // Inner circle gem shape
    const gemR = innerSize * 0.28;
    g.circle(0, 0, gemR);
    g.fill({ color: 0xffffff, alpha: 0.15 });
    g.circle(-gemR * 0.3, -gemR * 0.3, gemR * 0.3);
    g.fill({ color: 0xffffff, alpha: 0.25 });

    container.addChild(g);

    // Special overlay
    if (special !== 'none') {
      const specialTex = this.tileTextures.get(`special_${special}`);
      if (specialTex) {
        const overlay = new Sprite(specialTex);
        overlay.width = size * 0.45;
        overlay.height = size * 0.45;
        overlay.anchor.set(0.5);
        overlay.alpha = 0.9;
        container.addChild(overlay);
      } else {
        const sg = new Graphics();
        if (special === 'rocket_h') {
          sg.moveTo(-8, 0); sg.lineTo(8, 0);
          sg.moveTo(5, -3); sg.lineTo(8, 0); sg.lineTo(5, 3);
          sg.stroke({ color: 0xffffff, width: 2.5 });
        } else if (special === 'rocket_v') {
          sg.moveTo(0, -8); sg.lineTo(0, 8);
          sg.moveTo(-3, 5); sg.lineTo(0, 8); sg.lineTo(3, 5);
          sg.stroke({ color: 0xffffff, width: 2.5 });
        } else if (special === 'bomb') {
          sg.circle(0, 0, 7);
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
