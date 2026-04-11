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

// Royal Match inspired bright colors
const TILE_COLORS: Record<TileType, number> = {
  0: 0xe82030, // Red diamond
  1: 0x30b848, // Green tree
  2: 0x3088e8, // Blue bucket
  3: 0xf0c020, // Golden crown
  4: 0xa040d0, // Purple gem
};

const TILE_SHAPES: Record<TileType, string> = {
  0: 'diamond',  // Red = diamond shape
  1: 'round',    // Green = rounded
  2: 'round',    // Blue = rounded
  3: 'hexagon',  // Yellow = hexagonal
  4: 'diamond',  // Purple = diamond
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

    const g = new Graphics();
    const color = TILE_COLORS[type];
    const shape = TILE_SHAPES[type];
    const half = innerSize / 2;
    const r = 10;

    // Draw shape based on tile type
    if (shape === 'diamond') {
      // Diamond/rhombus shape
      g.moveTo(0, -half + 2);
      g.lineTo(half - 2, 0);
      g.lineTo(0, half - 2);
      g.lineTo(-half + 2, 0);
      g.closePath();
      g.fill({ color });
      // Highlight
      g.moveTo(0, -half + 5);
      g.lineTo(half * 0.5, -half * 0.15);
      g.lineTo(0, -half * 0.05);
      g.lineTo(-half * 0.5, -half * 0.15);
      g.closePath();
      g.fill({ color: 0xffffff, alpha: 0.35 });
    } else if (shape === 'hexagon') {
      // Hexagon shape
      const hr = half - 3;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = Math.cos(angle) * hr;
        const py = Math.sin(angle) * hr;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fill({ color });
      // Highlight
      g.roundRect(-half * 0.5, -half + 5, half, half * 0.5, 4);
      g.fill({ color: 0xffffff, alpha: 0.3 });
    } else {
      // Rounded/circle shape
      g.roundRect(-half, -half, innerSize, innerSize, r);
      g.fill({ color });
      // Glossy highlight
      g.roundRect(-half + 3, -half + 3, innerSize - 6, innerSize * 0.35, r - 2);
      g.fill({ color: 0xffffff, alpha: 0.35 });
    }

    // Bottom shadow for all shapes
    g.ellipse(0, half - 4, half * 0.6, 3);
    g.fill({ color: 0x000000, alpha: 0.12 });

    // Center shine
    g.circle(-half * 0.2, -half * 0.2, half * 0.15);
    g.fill({ color: 0xffffff, alpha: 0.3 });

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
