import { Sprite, Texture, Graphics, Container, Assets } from 'pixi.js';
import type { TileType, SpecialType, BlockerType } from './types.js';

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
  acquire(type: TileType, special: SpecialType = 'none', blocker: BlockerType = 'none', blockerHp: number = 0): Container {
    const container = new Container();
    this.active.add(container);
    this.drawTile(container, type, special);
    if (blocker !== 'none') {
      this.drawBlockerOverlay(container, blocker, blockerHp);
    }
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

  /** Draw blocker overlay on top of a tile */
  private drawBlockerOverlay(container: Container, blocker: BlockerType, hp: number): void {
    const size = this.tileSize;
    const innerSize = size - 2;
    const g = new Graphics();

    if (blocker === 'stone' || blocker === 'stone2') {
      // Stone overlay — semi-transparent grey with cracks
      g.roundRect(-innerSize / 2, -innerSize / 2, innerSize, innerSize, 10);
      g.fill({ color: 0x5a5a6e, alpha: hp > 1 ? 0.7 : 0.45 });

      // Crack lines
      g.moveTo(-innerSize * 0.15, -innerSize * 0.4);
      g.lineTo(innerSize * 0.05, 0);
      g.lineTo(-innerSize * 0.1, innerSize * 0.35);
      g.stroke({ color: 0x333346, width: hp > 1 ? 2 : 1.5 });

      if (hp > 1) {
        // Extra cracks for 2HP
        g.moveTo(innerSize * 0.2, -innerSize * 0.3);
        g.lineTo(innerSize * 0.1, innerSize * 0.2);
        g.stroke({ color: 0x333346, width: 1.5 });
      }

      // Top highlight
      g.roundRect(-innerSize / 2 + 3, -innerSize / 2 + 3, innerSize - 6, innerSize * 0.2, 6);
      g.fill({ color: 0x8a8a9e, alpha: 0.3 });
    } else if (blocker === 'ice') {
      // Ice overlay — blue-white semi-transparent
      g.roundRect(-innerSize / 2, -innerSize / 2, innerSize, innerSize, 10);
      g.fill({ color: 0x88ccff, alpha: 0.4 });

      // Ice crystal lines
      g.moveTo(-innerSize * 0.2, -innerSize * 0.3);
      g.lineTo(0, 0);
      g.lineTo(innerSize * 0.15, -innerSize * 0.25);
      g.stroke({ color: 0xaaddff, width: 1.5 });

      g.moveTo(0, 0);
      g.lineTo(innerSize * 0.1, innerSize * 0.3);
      g.stroke({ color: 0xaaddff, width: 1 });

      // Shine
      g.circle(-innerSize * 0.2, -innerSize * 0.2, 4);
      g.fill({ color: 0xffffff, alpha: 0.5 });
    } else if (blocker === 'chain') {
      // Chain overlay — X pattern
      const off = innerSize * 0.35;
      g.moveTo(-off, -off); g.lineTo(off, off);
      g.moveTo(off, -off); g.lineTo(-off, off);
      g.stroke({ color: 0x888888, width: 3 });

      g.circle(-off, -off, 3); g.fill({ color: 0x999999 });
      g.circle(off, -off, 3); g.fill({ color: 0x999999 });
      g.circle(-off, off, 3); g.fill({ color: 0x999999 });
      g.circle(off, off, 3); g.fill({ color: 0x999999 });
    }

    container.addChild(g);
  }

  get tilePixelSize(): number {
    return this.tileSize;
  }
}
