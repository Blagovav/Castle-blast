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

// Bold saturated colors like Royal Match
const TILE_COLORS: Record<TileType, { main: number; dark: number; light: number; outline: number }> = {
  0: { main: 0xe82030, dark: 0xa01520, light: 0xff5060, outline: 0x8a1018 }, // Red
  1: { main: 0x30b848, dark: 0x208830, light: 0x60e070, outline: 0x186820 }, // Green
  2: { main: 0x3088e8, dark: 0x2060b0, light: 0x60b0ff, outline: 0x184880 }, // Blue
  3: { main: 0xf0c020, dark: 0xc09010, light: 0xffe050, outline: 0x907010 }, // Yellow
  4: { main: 0xa840d0, dark: 0x7830a0, light: 0xc870f0, outline: 0x582878 }, // Purple
};

export class TilePool {
  private active: Set<Container> = new Set();
  private tileSize: number;
  private tileTextures: Map<string, Texture> = new Map();
  private _ready: boolean = false;

  constructor(tileSize: number) {
    this.tileSize = tileSize;
  }

  async preload(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const [type, path] of Object.entries(TILE_SPRITE_PATHS)) {
      promises.push(
        Assets.load(path).then((tex: Texture) => { this.tileTextures.set(`tile_${type}`, tex); }).catch(() => {})
      );
    }
    for (const [special, path] of Object.entries(SPECIAL_SPRITE_PATHS)) {
      promises.push(
        Assets.load(path).then((tex: Texture) => { this.tileTextures.set(`special_${special}`, tex); }).catch(() => {})
      );
    }
    await Promise.all(promises);
    this._ready = true;
  }

  get ready(): boolean { return this._ready; }

  acquire(type: TileType, special: SpecialType = 'none', blocker: BlockerType = 'none', blockerHp: number = 0): Container {
    const container = new Container();
    this.active.add(container);
    this.drawTile3D(container, type, special);
    if (blocker !== 'none') this.drawBlockerOverlay(container, blocker, blockerHp);
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

  /** Draw a bold 3D tile like Royal Match */
  private drawTile3D(container: Container, type: TileType, special: SpecialType): void {
    const size = this.tileSize;
    const s = size * 0.46; // half-size for drawing
    const colors = TILE_COLORS[type];
    const g = new Graphics();

    // === OUTER DARK BORDER (3D depth) ===
    g.roundRect(-s - 1, -s - 1, s * 2 + 2, s * 2 + 4, s * 0.3);
    g.fill({ color: colors.outline });

    // === MAIN BODY ===
    g.roundRect(-s, -s, s * 2, s * 2, s * 0.28);
    g.fill({ color: colors.main });

    // === TOP HIGHLIGHT (3D shine) ===
    g.roundRect(-s + 2, -s + 2, s * 2 - 4, s * 0.8, s * 0.25);
    g.fill({ color: colors.light, alpha: 0.5 });

    // === INNER SHAPE (gives each tile unique silhouette) ===
    if (type === 0) {
      // Red: diamond facet
      g.moveTo(0, -s * 0.65);
      g.lineTo(s * 0.55, 0);
      g.lineTo(0, s * 0.65);
      g.lineTo(-s * 0.55, 0);
      g.closePath();
      g.fill({ color: colors.light, alpha: 0.2 });
    } else if (type === 1) {
      // Green: leaf/circle
      g.circle(0, s * 0.05, s * 0.5);
      g.fill({ color: colors.light, alpha: 0.2 });
    } else if (type === 2) {
      // Blue: bucket shape
      g.roundRect(-s * 0.4, -s * 0.3, s * 0.8, s * 0.7, s * 0.12);
      g.fill({ color: colors.light, alpha: 0.2 });
    } else if (type === 3) {
      // Yellow: crown points
      g.moveTo(-s * 0.5, s * 0.2);
      g.lineTo(-s * 0.35, -s * 0.35);
      g.lineTo(-s * 0.1, -s * 0.1);
      g.lineTo(0, -s * 0.45);
      g.lineTo(s * 0.1, -s * 0.1);
      g.lineTo(s * 0.35, -s * 0.35);
      g.lineTo(s * 0.5, s * 0.2);
      g.closePath();
      g.fill({ color: colors.light, alpha: 0.25 });
    } else {
      // Purple: star
      g.star(0, 0, 5, s * 0.25, s * 0.5);
      g.fill({ color: colors.light, alpha: 0.2 });
    }

    // === SPECULAR HIGHLIGHT (white dot) ===
    g.circle(-s * 0.25, -s * 0.3, s * 0.12);
    g.fill({ color: 0xffffff, alpha: 0.6 });
    g.circle(-s * 0.15, -s * 0.2, s * 0.06);
    g.fill({ color: 0xffffff, alpha: 0.8 });

    // === BOTTOM SHADOW ===
    g.ellipse(0, s * 0.85, s * 0.5, s * 0.08);
    g.fill({ color: 0x000000, alpha: 0.08 });

    container.addChild(g);

    // === SPECIAL OVERLAY ===
    if (special !== 'none') {
      const sg = new Graphics();
      if (special === 'rocket_h') {
        sg.roundRect(-s * 0.7, -3, s * 1.4, 6, 3);
        sg.fill({ color: 0xffffff, alpha: 0.6 });
        sg.moveTo(s * 0.4, -5); sg.lineTo(s * 0.6, 0); sg.lineTo(s * 0.4, 5);
        sg.fill({ color: 0xffffff, alpha: 0.8 });
      } else if (special === 'rocket_v') {
        sg.roundRect(-3, -s * 0.7, 6, s * 1.4, 3);
        sg.fill({ color: 0xffffff, alpha: 0.6 });
        sg.moveTo(-5, s * 0.4); sg.lineTo(0, s * 0.6); sg.lineTo(5, s * 0.4);
        sg.fill({ color: 0xffffff, alpha: 0.8 });
      } else if (special === 'bomb') {
        sg.circle(0, 0, s * 0.35);
        sg.fill({ color: 0xffffff, alpha: 0.5 });
        sg.star(0, 0, 8, s * 0.15, s * 0.4);
        sg.fill({ color: 0xffffff, alpha: 0.3 });
      }
      container.addChild(sg);
    }
  }

  /** Draw blocker overlay */
  private drawBlockerOverlay(container: Container, blocker: BlockerType, hp: number): void {
    const s = this.tileSize * 0.46;
    const g = new Graphics();

    if (blocker === 'stone' || blocker === 'stone2') {
      g.roundRect(-s, -s, s * 2, s * 2, s * 0.28);
      g.fill({ color: 0x6a6a7a, alpha: hp > 1 ? 0.65 : 0.4 });
      // Cracks
      g.moveTo(-s * 0.2, -s * 0.7); g.lineTo(s * 0.05, 0); g.lineTo(-s * 0.15, s * 0.6);
      g.stroke({ color: 0x444455, width: hp > 1 ? 2 : 1.5 });
      if (hp > 1) {
        g.moveTo(s * 0.25, -s * 0.5); g.lineTo(s * 0.15, s * 0.3);
        g.stroke({ color: 0x444455, width: 1.5 });
      }
      g.roundRect(-s + 2, -s + 2, s * 2 - 4, s * 0.5, s * 0.2);
      g.fill({ color: 0x8a8a9a, alpha: 0.25 });
    } else if (blocker === 'ice') {
      g.roundRect(-s, -s, s * 2, s * 2, s * 0.28);
      g.fill({ color: 0x88ccff, alpha: 0.35 });
      g.moveTo(-s * 0.3, -s * 0.5); g.lineTo(0, 0); g.lineTo(s * 0.2, -s * 0.4);
      g.stroke({ color: 0xaaddff, width: 1.5 });
      g.circle(-s * 0.25, -s * 0.3, 3);
      g.fill({ color: 0xffffff, alpha: 0.6 });
    } else if (blocker === 'chain') {
      const off = s * 0.55;
      g.moveTo(-off, -off); g.lineTo(off, off);
      g.moveTo(off, -off); g.lineTo(-off, off);
      g.stroke({ color: 0x777788, width: 3 });
      g.circle(-off, -off, 3); g.fill({ color: 0x888899 });
      g.circle(off, off, 3); g.fill({ color: 0x888899 });
      g.circle(off, -off, 3); g.fill({ color: 0x888899 });
      g.circle(-off, off, 3); g.fill({ color: 0x888899 });
    }

    container.addChild(g);
  }

  get tilePixelSize(): number { return this.tileSize; }
}
