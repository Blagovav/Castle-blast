import { Sprite, Texture, Graphics, Container, Assets } from 'pixi.js';
import type { TileType, SpecialType, BlockerType } from './types.js';

// v2 sprite paths (3D rendered on white background)
const TILE_PATHS: Record<number, string> = {
  0: '/sprites/tile_red_v2.png',
  1: '/sprites/tile_green_v2.png',
  2: '/sprites/tile_blue_v2.png',
  3: '/sprites/tile_yellow_v2.png',
  4: '/sprites/tile_purple_v2.png',
};

// Fallback colors if sprites fail
const TILE_COLORS: Record<TileType, number> = {
  0: 0xe82030, 1: 0x28b848, 2: 0x2888e8, 3: 0xf0b818, 4: 0xa040d0,
};

export class TilePool {
  private active: Set<Container> = new Set();
  private sz: number;
  private textures: Map<string, Texture> = new Map();
  private _ready = false;

  constructor(tileSize: number) { this.sz = tileSize; }

  /** Preload all sprite textures */
  async preload(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const [type, path] of Object.entries(TILE_PATHS)) {
      promises.push(
        Assets.load(path)
          .then((tex: Texture) => { this.textures.set(`tile_${type}`, tex); })
          .catch(() => {})
      );
    }
    // Load special sprites
    for (const [name, path] of [
      ['rocket_h', '/sprites/special_rocket_h_v2.png'],
      ['rocket_v', '/sprites/special_rocket_v_v2.png'],
      ['bomb', '/sprites/special_bomb_v2.png'],
    ]) {
      promises.push(
        Assets.load(path)
          .then((tex: Texture) => { this.textures.set(`special_${name}`, tex); })
          .catch(() => {})
      );
    }
    await Promise.all(promises);
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
    this.active.delete(c); c.visible = false; c.removeFromParent(); c.removeChildren();
  }

  releaseAll() {
    for (const c of this.active) { c.visible = false; c.removeFromParent(); c.removeChildren(); }
    this.active.clear();
  }

  private drawTile(container: Container, type: TileType): void {
    const size = this.sz * 0.92; // Fill 92% of cell
    const tex = this.textures.get(`tile_${type}`);

    if (tex) {
      // Use actual 3D sprite image!
      const sprite = new Sprite(tex);
      sprite.width = size;
      sprite.height = size;
      sprite.anchor.set(0.5);
      container.addChild(sprite);
    } else {
      // Fallback: simple colored circle
      const g = new Graphics();
      const r = size / 2;
      g.circle(0, 1, r);
      g.fill({ color: TILE_COLORS[type] - 0x202020 });
      g.circle(0, 0, r);
      g.fill({ color: TILE_COLORS[type] });
      g.circle(-r * 0.2, -r * 0.2, r * 0.3);
      g.fill({ color: 0xffffff, alpha: 0.3 });
      container.addChild(g);
    }
  }

  private drawSpecial(container: Container, special: SpecialType): void {
    const r = this.sz * 0.35;
    const tex = this.textures.get(`special_${special}`);

    if (tex) {
      const sprite = new Sprite(tex);
      sprite.width = r * 1.4;
      sprite.height = r * 1.4;
      sprite.anchor.set(0.5);
      sprite.alpha = 0.85;
      container.addChild(sprite);
    } else {
      const g = new Graphics();
      if (special === 'rocket_h') {
        g.roundRect(-r * 0.7, -3, r * 1.4, 6, 3);
        g.fill({ color: 0xffffff, alpha: 0.7 });
      } else if (special === 'rocket_v') {
        g.roundRect(-3, -r * 0.7, 6, r * 1.4, 3);
        g.fill({ color: 0xffffff, alpha: 0.7 });
      } else if (special === 'bomb') {
        g.circle(0, 0, r * 0.3);
        g.fill({ color: 0xffffff, alpha: 0.5 });
        g.star(0, 0, 8, r * 0.15, r * 0.35);
        g.fill({ color: 0xffffff, alpha: 0.3 });
      }
      container.addChild(g);
    }
  }

  private drawBlocker(container: Container, blocker: BlockerType, hp: number): void {
    const r = this.sz * 0.45;
    const g = new Graphics();
    if (blocker === 'stone' || blocker === 'stone2') {
      g.roundRect(-r, -r, r * 2, r * 2, r * 0.2);
      g.fill({ color: 0x6a6a7a, alpha: hp > 1 ? 0.65 : 0.4 });
      g.moveTo(-r * 0.2, -r * 0.7); g.lineTo(r * 0.05, 0); g.lineTo(-r * 0.1, r * 0.6);
      g.stroke({ color: 0x444455, width: hp > 1 ? 2 : 1.5 });
    } else if (blocker === 'ice') {
      g.roundRect(-r, -r, r * 2, r * 2, r * 0.2);
      g.fill({ color: 0x88ccff, alpha: 0.35 });
    } else if (blocker === 'chain') {
      const o = r * 0.6;
      g.moveTo(-o, -o); g.lineTo(o, o); g.moveTo(o, -o); g.lineTo(-o, o);
      g.stroke({ color: 0x777788, width: 3 });
    }
    container.addChild(g);
  }

  get tilePixelSize() { return this.sz; }
}
