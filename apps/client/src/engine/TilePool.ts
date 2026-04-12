import { Sprite, Texture, Graphics, Container, Assets } from 'pixi.js';
import type { TileType, SpecialType, BlockerType } from './types.js';

// Royal Match colors — vivid
const TC: Record<TileType, { fill: number; dark: number; hi: number; outline: number }> = {
  0: { fill: 0xe82030, dark: 0x8a1218, hi: 0xff7080, outline: 0x6a0a10 }, // Red diamond
  1: { fill: 0x28b848, dark: 0x147028, hi: 0x70e880, outline: 0x0a4a10 }, // Green tree
  2: { fill: 0x2888e8, dark: 0x145898, hi: 0x68c0ff, outline: 0x0a3870 }, // Blue bucket
  3: { fill: 0xf0b818, dark: 0xa07808, hi: 0xffe860, outline: 0x685008 }, // Yellow crown
  4: { fill: 0xa040d0, dark: 0x602880, hi: 0xd080ff, outline: 0x401860 }, // Purple star
};

export class TilePool {
  private active: Set<Container> = new Set();
  private sz: number;
  private _ready = false;

  constructor(tileSize: number) { this.sz = tileSize; }
  async preload(): Promise<void> { this._ready = true; }
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
    this.active.delete(c); c.visible = false; c.removeFromParent(); c.removeChildren();
  }

  releaseAll() {
    for (const c of this.active) { c.visible = false; c.removeFromParent(); c.removeChildren(); }
    this.active.clear();
  }

  private drawTile(container: Container, type: TileType): void {
    const s = this.sz;
    const r = s * 0.46; // Fill 92% of cell
    const c = TC[type];
    const g = new Graphics();

    switch (type) {
      case 0: this.drawDiamond(g, r, c); break;
      case 1: this.drawTree(g, r, c); break;
      case 2: this.drawBucket(g, r, c); break;
      case 3: this.drawCrown(g, r, c); break;
      case 4: this.drawStar(g, r, c); break;
    }

    container.addChild(g);
  }

  /** RED DIAMOND — faceted gem with thick outline */
  private drawDiamond(g: Graphics, r: number, c: typeof TC[0]): void {
    const pts = (scale: number, offy = 0) => {
      g.moveTo(0, -r * 0.95 * scale + offy);
      g.lineTo(r * 0.85 * scale, offy);
      g.lineTo(0, r * 0.95 * scale + offy);
      g.lineTo(-r * 0.85 * scale, offy);
      g.closePath();
    };

    // Dark outline (thick)
    pts(1.12, 1); g.fill({ color: c.outline });
    // Shadow layer
    pts(1.05, 2); g.fill({ color: c.dark });
    // Main body
    pts(1, 0); g.fill({ color: c.fill });
    // Top facet highlight
    g.moveTo(0, -r * 0.9);
    g.lineTo(r * 0.4, -r * 0.1);
    g.lineTo(0, r * 0.15);
    g.lineTo(-r * 0.4, -r * 0.1);
    g.closePath();
    g.fill({ color: c.hi, alpha: 0.4 });
    // Sparkle
    g.circle(-r * 0.2, -r * 0.4, r * 0.12);
    g.fill({ color: 0xffffff, alpha: 0.8 });
    g.circle(-r * 0.2, -r * 0.4, r * 0.05);
    g.fill({ color: 0xffffff });
  }

  /** GREEN TREE — round bush with trunk */
  private drawTree(g: Graphics, r: number, c: typeof TC[0]): void {
    // Trunk
    g.roundRect(-r * 0.1, r * 0.3, r * 0.2, r * 0.55, 3);
    g.fill({ color: 0x6a4020 });

    // Canopy outline
    g.circle(0, -r * 0.05 + 1, r * 0.78);
    g.fill({ color: c.outline });
    // Canopy shadow
    g.circle(0, -r * 0.05 + 1, r * 0.73);
    g.fill({ color: c.dark });
    // Canopy main
    g.circle(0, -r * 0.08, r * 0.7);
    g.fill({ color: c.fill });
    // Leaf bumps for texture
    g.circle(-r * 0.3, -r * 0.3, r * 0.3);
    g.fill({ color: c.fill });
    g.circle(r * 0.25, -r * 0.2, r * 0.28);
    g.fill({ color: c.fill });
    g.circle(0, -r * 0.4, r * 0.25);
    g.fill({ color: c.fill });
    // Highlights on bumps
    g.circle(-r * 0.25, -r * 0.4, r * 0.2);
    g.fill({ color: c.hi, alpha: 0.35 });
    g.circle(r * 0.15, -r * 0.35, r * 0.15);
    g.fill({ color: c.hi, alpha: 0.25 });
    // Sparkle
    g.circle(-r * 0.15, -r * 0.5, r * 0.08);
    g.fill({ color: 0xffffff, alpha: 0.7 });
  }

  /** BLUE BUCKET — 3D trapezoid container */
  private drawBucket(g: Graphics, r: number, c: typeof TC[0]): void {
    const bucket = (scale: number, offy: number) => {
      const s = scale;
      g.moveTo(-r * 0.55 * s, -r * 0.55 * s + offy);
      g.lineTo(r * 0.55 * s, -r * 0.55 * s + offy);
      g.lineTo(r * 0.72 * s, r * 0.6 * s + offy);
      g.lineTo(-r * 0.72 * s, r * 0.6 * s + offy);
      g.closePath();
    };

    // Outline
    bucket(1.12, 1); g.fill({ color: c.outline });
    // Shadow
    bucket(1.06, 2); g.fill({ color: c.dark });
    // Body
    bucket(1, 0); g.fill({ color: c.fill });
    // Rim (top edge)
    g.roundRect(-r * 0.62, -r * 0.68, r * 1.24, r * 0.22, 5);
    g.fill({ color: c.outline });
    g.roundRect(-r * 0.58, -r * 0.64, r * 1.16, r * 0.16, 4);
    g.fill({ color: c.hi, alpha: 0.6 });
    // Front panel highlight
    g.moveTo(-r * 0.3, -r * 0.4);
    g.lineTo(r * 0.05, -r * 0.4);
    g.lineTo(r * 0.1, r * 0.35);
    g.lineTo(-r * 0.35, r * 0.35);
    g.closePath();
    g.fill({ color: c.hi, alpha: 0.2 });
    // Sparkle
    g.circle(-r * 0.25, -r * 0.3, r * 0.08);
    g.fill({ color: 0xffffff, alpha: 0.7 });
  }

  /** YELLOW CROWN — royal crown with gems */
  private drawCrown(g: Graphics, r: number, c: typeof TC[0]): void {
    const crown = (scale: number, offy: number) => {
      const s = scale;
      // Base band
      g.roundRect(-r * 0.68 * s, r * 0.05 * s + offy, r * 1.36 * s, r * 0.55 * s, 6);
      g.fill({ color: scale > 1 ? c.outline : c.fill });
      // Points
      g.moveTo(-r * 0.68 * s, r * 0.1 * s + offy);
      g.lineTo(-r * 0.55 * s, -r * 0.6 * s + offy);
      g.lineTo(-r * 0.28 * s, -r * 0.15 * s + offy);
      g.lineTo(0, -r * 0.78 * s + offy);
      g.lineTo(r * 0.28 * s, -r * 0.15 * s + offy);
      g.lineTo(r * 0.55 * s, -r * 0.6 * s + offy);
      g.lineTo(r * 0.68 * s, r * 0.1 * s + offy);
      g.closePath();
      g.fill({ color: scale > 1 ? c.outline : c.fill });
    };

    // Outline
    crown(1.1, 2);
    // Shadow
    crown(1.05, 1);
    g.fill({ color: c.dark });
    // Main crown
    crown(1, 0);
    // Highlight on crown body
    g.moveTo(-r * 0.55, r * 0.05);
    g.lineTo(-r * 0.45, -r * 0.45);
    g.lineTo(-r * 0.2, -r * 0.1);
    g.lineTo(0, -r * 0.6);
    g.lineTo(r * 0.1, -r * 0.2);
    g.lineTo(-r * 0.55, r * 0.05);
    g.closePath();
    g.fill({ color: c.hi, alpha: 0.3 });
    // Gems on the band
    g.circle(-r * 0.32, r * 0.3, r * 0.11);
    g.fill({ color: 0xe82030 });
    g.circle(-r * 0.32, r * 0.3, r * 0.05);
    g.fill({ color: 0xff8080, alpha: 0.5 });
    g.circle(0, r * 0.3, r * 0.11);
    g.fill({ color: 0x2888e8 });
    g.circle(0, r * 0.3, r * 0.05);
    g.fill({ color: 0x80c0ff, alpha: 0.5 });
    g.circle(r * 0.32, r * 0.3, r * 0.11);
    g.fill({ color: 0x28b848 });
    g.circle(r * 0.32, r * 0.3, r * 0.05);
    g.fill({ color: 0x80e880, alpha: 0.5 });
    // Tip sparkles
    g.circle(0, -r * 0.65, r * 0.06);
    g.fill({ color: 0xffffff, alpha: 0.8 });
    g.circle(-r * 0.48, -r * 0.5, r * 0.05);
    g.fill({ color: 0xffffff, alpha: 0.6 });
    g.circle(r * 0.48, -r * 0.5, r * 0.05);
    g.fill({ color: 0xffffff, alpha: 0.6 });
  }

  /** PURPLE STAR — 4-pointed magical star */
  private drawStar(g: Graphics, r: number, c: typeof TC[0]): void {
    // Outline
    g.star(0, 2, 4, r * 0.38, r * 0.85);
    g.fill({ color: c.outline });
    // Shadow
    g.star(0, 1, 4, r * 0.35, r * 0.8);
    g.fill({ color: c.dark });
    // Main
    g.star(0, 0, 4, r * 0.32, r * 0.75);
    g.fill({ color: c.fill });
    // Inner glow
    g.star(0, -r * 0.05, 4, r * 0.2, r * 0.45);
    g.fill({ color: c.hi, alpha: 0.35 });
    // Center circle
    g.circle(0, 0, r * 0.18);
    g.fill({ color: c.hi, alpha: 0.3 });
    // Sparkle
    g.circle(-r * 0.1, -r * 0.25, r * 0.08);
    g.fill({ color: 0xffffff, alpha: 0.8 });
    g.circle(-r * 0.1, -r * 0.25, r * 0.03);
    g.fill({ color: 0xffffff });
  }

  private drawSpecial(container: Container, special: SpecialType): void {
    const r = this.sz * 0.47;
    const g = new Graphics();
    if (special === 'rocket_h') {
      g.roundRect(-r * 0.7, -3, r * 1.4, 6, 3);
      g.fill({ color: 0xffffff, alpha: 0.7 });
      g.moveTo(r * 0.45, -5); g.lineTo(r * 0.65, 0); g.lineTo(r * 0.45, 5);
      g.fill({ color: 0xffffff, alpha: 0.9 });
    } else if (special === 'rocket_v') {
      g.roundRect(-3, -r * 0.7, 6, r * 1.4, 3);
      g.fill({ color: 0xffffff, alpha: 0.7 });
      g.moveTo(-5, r * 0.45); g.lineTo(0, r * 0.65); g.lineTo(5, r * 0.45);
      g.fill({ color: 0xffffff, alpha: 0.9 });
    } else if (special === 'bomb') {
      g.circle(0, 0, r * 0.25);
      g.fill({ color: 0xffffff, alpha: 0.5 });
      g.star(0, 0, 8, r * 0.12, r * 0.32);
      g.fill({ color: 0xffffff, alpha: 0.3 });
    }
    container.addChild(g);
  }

  private drawBlocker(container: Container, blocker: BlockerType, hp: number): void {
    const r = this.sz * 0.47;
    const g = new Graphics();
    if (blocker === 'stone' || blocker === 'stone2') {
      g.roundRect(-r, -r, r * 2, r * 2, r * 0.2);
      g.fill({ color: 0x6a6a7a, alpha: hp > 1 ? 0.65 : 0.4 });
      g.moveTo(-r * 0.2, -r * 0.7); g.lineTo(r * 0.05, 0); g.lineTo(-r * 0.1, r * 0.6);
      g.stroke({ color: 0x444455, width: hp > 1 ? 2 : 1.5 });
      if (hp > 1) { g.moveTo(r * 0.3, -r * 0.5); g.lineTo(r * 0.15, r * 0.4); g.stroke({ color: 0x444455, width: 1.5 }); }
    } else if (blocker === 'ice') {
      g.roundRect(-r, -r, r * 2, r * 2, r * 0.2);
      g.fill({ color: 0x88ccff, alpha: 0.35 });
      g.circle(-r * 0.3, -r * 0.3, 3);
      g.fill({ color: 0xffffff, alpha: 0.6 });
    } else if (blocker === 'chain') {
      const o = r * 0.6;
      g.moveTo(-o, -o); g.lineTo(o, o); g.moveTo(o, -o); g.lineTo(-o, o);
      g.stroke({ color: 0x777788, width: 3 });
    }
    container.addChild(g);
  }

  get tilePixelSize() { return this.sz; }
}
