import { Sprite, Texture, Graphics, Container, Assets } from 'pixi.js';
import type { TileType, SpecialType, BlockerType } from './types.js';

const TILE_SPRITE_PATHS: Record<number, string> = {
  0: '/sprites/tile_0.png', 1: '/sprites/tile_1.png', 2: '/sprites/tile_2.png',
  3: '/sprites/tile_3.png', 4: '/sprites/tile_4.png',
};
const SPECIAL_SPRITE_PATHS: Record<string, string> = {
  rocket_h: '/sprites/special_rocket_h.png', rocket_v: '/sprites/special_rocket_v.png',
  bomb: '/sprites/special_bomb.png',
};

// Royal Match colors — vivid and saturated
const TC: Record<TileType, { fill: number; dark: number; hi: number }> = {
  0: { fill: 0xe82030, dark: 0x9a1520, hi: 0xff6070 }, // Red
  1: { fill: 0x28b040, dark: 0x1a7828, hi: 0x50e060 }, // Green
  2: { fill: 0x2880e0, dark: 0x1a58a0, hi: 0x58b0ff }, // Blue
  3: { fill: 0xf0b818, dark: 0xb08010, hi: 0xffe050 }, // Yellow
  4: { fill: 0xa038c8, dark: 0x702890, hi: 0xc868f0 }, // Purple
};

export class TilePool {
  private active: Set<Container> = new Set();
  private tileSize: number;
  private tileTextures: Map<string, Texture> = new Map();
  private _ready: boolean = false;

  constructor(tileSize: number) { this.tileSize = tileSize; }

  async preload(): Promise<void> {
    const p: Promise<void>[] = [];
    for (const [t, path] of Object.entries(TILE_SPRITE_PATHS))
      p.push(Assets.load(path).then((tex: Texture) => { this.tileTextures.set(`tile_${t}`, tex); }).catch(() => {}));
    for (const [s, path] of Object.entries(SPECIAL_SPRITE_PATHS))
      p.push(Assets.load(path).then((tex: Texture) => { this.tileTextures.set(`special_${s}`, tex); }).catch(() => {}));
    await Promise.all(p);
    this._ready = true;
  }

  get ready() { return this._ready; }

  acquire(type: TileType, special: SpecialType = 'none', blocker: BlockerType = 'none', blockerHp = 0): Container {
    const c = new Container();
    this.active.add(c);
    this.drawTile(c, type);
    if (special !== 'none') this.drawSpecial(c, special);
    if (blocker !== 'none') this.drawBlocker(c, blocker, blockerHp);
    c.visible = true;
    return c;
  }

  release(c: Container) {
    if (!this.active.has(c)) return;
    this.active.delete(c);
    c.visible = false; c.removeFromParent(); c.removeChildren();
  }

  releaseAll() {
    for (const c of this.active) { c.visible = false; c.removeFromParent(); c.removeChildren(); }
    this.active.clear();
  }

  private drawTile(container: Container, type: TileType): void {
    const sz = this.tileSize;
    const r = sz * 0.38; // tile radius — 76% of cell = visible gap
    const c = TC[type];
    const g = new Graphics();

    switch (type) {
      case 0: // RED DIAMOND — big faceted gem
        // Outer dark shadow
        g.moveTo(0, -r * 0.95 + 2);
        g.lineTo(r * 0.85 + 1, 2);
        g.lineTo(0, r * 0.95 + 2);
        g.lineTo(-r * 0.85 - 1, 2);
        g.closePath();
        g.fill({ color: c.dark });
        // Main diamond
        g.moveTo(0, -r * 0.95);
        g.lineTo(r * 0.85, 0);
        g.lineTo(0, r * 0.95);
        g.lineTo(-r * 0.85, 0);
        g.closePath();
        g.fill({ color: c.fill });
        // Top facet
        g.moveTo(0, -r * 0.95);
        g.lineTo(r * 0.42, -r * 0.15);
        g.lineTo(0, r * 0.1);
        g.lineTo(-r * 0.42, -r * 0.15);
        g.closePath();
        g.fill({ color: c.hi, alpha: 0.35 });
        // Sparkle
        g.circle(-r * 0.2, -r * 0.4, r * 0.1);
        g.fill({ color: 0xffffff, alpha: 0.7 });
        break;

      case 1: // GREEN TREE — rounded bush/tree shape
        // Trunk shadow
        g.roundRect(-r * 0.12, r * 0.35, r * 0.24, r * 0.5, 3);
        g.fill({ color: 0x5a3a1a });
        // Canopy shadow
        g.circle(0, -r * 0.05 + 2, r * 0.72);
        g.fill({ color: c.dark });
        // Canopy
        g.circle(0, -r * 0.05, r * 0.7);
        g.fill({ color: c.fill });
        // Highlight bumps
        g.circle(-r * 0.25, -r * 0.35, r * 0.28);
        g.fill({ color: c.hi, alpha: 0.3 });
        g.circle(r * 0.15, -r * 0.2, r * 0.22);
        g.fill({ color: c.hi, alpha: 0.2 });
        // Sparkle
        g.circle(-r * 0.15, -r * 0.45, r * 0.08);
        g.fill({ color: 0xffffff, alpha: 0.65 });
        break;

      case 2: // BLUE BUCKET — 3D trapezoid container
        // Shadow
        g.moveTo(-r * 0.55, -r * 0.6 + 2);
        g.lineTo(r * 0.55, -r * 0.6 + 2);
        g.lineTo(r * 0.7, r * 0.65 + 2);
        g.lineTo(-r * 0.7, r * 0.65 + 2);
        g.closePath();
        g.fill({ color: c.dark });
        // Main bucket body
        g.moveTo(-r * 0.55, -r * 0.6);
        g.lineTo(r * 0.55, -r * 0.6);
        g.lineTo(r * 0.7, r * 0.65);
        g.lineTo(-r * 0.7, r * 0.65);
        g.closePath();
        g.fill({ color: c.fill });
        // Rim at top
        g.roundRect(-r * 0.6, -r * 0.72, r * 1.2, r * 0.2, 4);
        g.fill({ color: c.hi, alpha: 0.5 });
        // Front highlight
        g.moveTo(-r * 0.35, -r * 0.45);
        g.lineTo(r * 0.1, -r * 0.45);
        g.lineTo(r * 0.15, r * 0.3);
        g.lineTo(-r * 0.4, r * 0.3);
        g.closePath();
        g.fill({ color: c.hi, alpha: 0.2 });
        // Sparkle
        g.circle(-r * 0.25, -r * 0.35, r * 0.08);
        g.fill({ color: 0xffffff, alpha: 0.6 });
        break;

      case 3: // YELLOW CROWN — royal crown shape
        // Shadow
        g.roundRect(-r * 0.65, r * 0.1 + 2, r * 1.3, r * 0.45, 5);
        g.fill({ color: c.dark });
        // Base band
        g.roundRect(-r * 0.65, r * 0.1, r * 1.3, r * 0.45, 5);
        g.fill({ color: c.fill });
        // Crown points
        g.moveTo(-r * 0.65, r * 0.1);
        g.lineTo(-r * 0.55, -r * 0.55);
        g.lineTo(-r * 0.3, -r * 0.15);
        g.lineTo(0, -r * 0.7);
        g.lineTo(r * 0.3, -r * 0.15);
        g.lineTo(r * 0.55, -r * 0.55);
        g.lineTo(r * 0.65, r * 0.1);
        g.closePath();
        g.fill({ color: c.fill });
        // Crown highlight
        g.moveTo(-r * 0.55, r * 0.05);
        g.lineTo(-r * 0.45, -r * 0.4);
        g.lineTo(-r * 0.25, -r * 0.1);
        g.lineTo(0, -r * 0.55);
        g.lineTo(r * 0.1, -r * 0.25);
        g.lineTo(-r * 0.55, r * 0.05);
        g.closePath();
        g.fill({ color: c.hi, alpha: 0.3 });
        // Gems on band
        g.circle(-r * 0.3, r * 0.3, r * 0.1);
        g.fill({ color: 0xe82030 });
        g.circle(0, r * 0.3, r * 0.1);
        g.fill({ color: 0x2880e0 });
        g.circle(r * 0.3, r * 0.3, r * 0.1);
        g.fill({ color: 0x28b040 });
        // Sparkle
        g.circle(-r * 0.1, -r * 0.4, r * 0.07);
        g.fill({ color: 0xffffff, alpha: 0.7 });
        break;

      case 4: // PURPLE STAR — magical star gem
        // Shadow
        g.star(0, 2, 4, r * 0.35, r * 0.78);
        g.fill({ color: c.dark });
        // Main star
        g.star(0, 0, 4, r * 0.35, r * 0.75);
        g.fill({ color: c.fill });
        // Inner highlight
        g.star(0, -r * 0.05, 4, r * 0.2, r * 0.45);
        g.fill({ color: c.hi, alpha: 0.3 });
        // Sparkle
        g.circle(-r * 0.15, -r * 0.3, r * 0.08);
        g.fill({ color: 0xffffff, alpha: 0.7 });
        break;
    }

    container.addChild(g);
  }

  private drawSpecial(container: Container, special: SpecialType): void {
    const r = this.tileSize * 0.38;
    const g = new Graphics();
    if (special === 'rocket_h') {
      g.roundRect(-r * 0.65, -2, r * 1.3, 4, 2);
      g.fill({ color: 0xffffff, alpha: 0.7 });
      g.moveTo(r * 0.4, -4); g.lineTo(r * 0.6, 0); g.lineTo(r * 0.4, 4);
      g.fill({ color: 0xffffff, alpha: 0.9 });
    } else if (special === 'rocket_v') {
      g.roundRect(-2, -r * 0.65, 4, r * 1.3, 2);
      g.fill({ color: 0xffffff, alpha: 0.7 });
      g.moveTo(-4, r * 0.4); g.lineTo(0, r * 0.6); g.lineTo(4, r * 0.4);
      g.fill({ color: 0xffffff, alpha: 0.9 });
    } else if (special === 'bomb') {
      g.circle(0, 0, r * 0.3);
      g.fill({ color: 0xffffff, alpha: 0.5 });
      g.star(0, 0, 6, r * 0.15, r * 0.35);
      g.fill({ color: 0xffffff, alpha: 0.3 });
    }
    container.addChild(g);
  }

  private drawBlocker(container: Container, blocker: BlockerType, hp: number): void {
    const r = this.tileSize * 0.38;
    const g = new Graphics();
    if (blocker === 'stone' || blocker === 'stone2') {
      g.roundRect(-r, -r, r * 2, r * 2, r * 0.25);
      g.fill({ color: 0x6a6a7a, alpha: hp > 1 ? 0.6 : 0.35 });
      g.moveTo(-r * 0.2, -r * 0.7); g.lineTo(r * 0.05, 0); g.lineTo(-r * 0.15, r * 0.6);
      g.stroke({ color: 0x444455, width: hp > 1 ? 2 : 1.5 });
      if (hp > 1) { g.moveTo(r * 0.25, -r * 0.5); g.lineTo(r * 0.15, r * 0.3); g.stroke({ color: 0x444455, width: 1.5 }); }
    } else if (blocker === 'ice') {
      g.roundRect(-r, -r, r * 2, r * 2, r * 0.25);
      g.fill({ color: 0x88ccff, alpha: 0.3 });
      g.circle(-r * 0.25, -r * 0.3, 3);
      g.fill({ color: 0xffffff, alpha: 0.6 });
    } else if (blocker === 'chain') {
      const o = r * 0.6;
      g.moveTo(-o, -o); g.lineTo(o, o); g.moveTo(o, -o); g.lineTo(-o, o);
      g.stroke({ color: 0x777788, width: 3 });
    }
    container.addChild(g);
  }

  get tilePixelSize() { return this.tileSize; }
}
