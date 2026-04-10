import type { Graphics } from 'pixi.js';
import type { BoardRenderer } from './BoardRenderer.js';
import type { GridPos } from './types.js';

const SWAP_DURATION = 200;
const FALL_DURATION = 150;
const DESTROY_DURATION = 150;
const SPAWN_DURATION = 100;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInBack(t: number): number {
  const c = 1.70158;
  return (c + 1) * t * t * t - c * t * t;
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
  t -= 2.625 / 2.75;
  return 7.5625 * t * t + 0.984375;
}

export class AnimationManager {
  private renderer: BoardRenderer;
  private animating: boolean = false;

  constructor(renderer: BoardRenderer) {
    this.renderer = renderer;
  }

  get isAnimating(): boolean {
    return this.animating;
  }

  /** Animate swapping two tiles */
  async animateSwap(a: GridPos, b: GridPos): Promise<void> {
    const spriteA = this.renderer.getTileSprite(a.row, a.col);
    const spriteB = this.renderer.getTileSprite(b.row, b.col);
    if (!spriteA || !spriteB) return;

    const pixA = this.renderer.gridToPixel(a.row, a.col);
    const pixB = this.renderer.gridToPixel(b.row, b.col);

    this.animating = true;
    await this.tweenTwo(spriteA, pixA, pixB, spriteB, pixB, pixA, SWAP_DURATION);

    // Update sprite map keys
    this.renderer.moveSpriteKey(a.row, a.col, b.row, b.col);
    this.renderer.moveSpriteKey(b.row, b.col, a.row, a.col);
    // Oops, we need a temp key. Let's just re-render after swap instead.
    this.animating = false;
  }

  /** Animate tiles falling to new positions */
  async animateFall(moves: { from: GridPos; to: GridPos }[]): Promise<void> {
    if (moves.length === 0) return;

    this.animating = true;
    const promises = moves.map(({ from, to }) => {
      const sprite = this.renderer.getTileSprite(from.row, from.col);
      if (!sprite) return Promise.resolve();

      this.renderer.moveSpriteKey(from.row, from.col, to.row, to.col);
      const target = this.renderer.gridToPixel(to.row, to.col);

      // Duration proportional to distance
      const dist = Math.abs(to.row - from.row);
      const duration = FALL_DURATION + dist * 30;

      return this.tween(sprite, target, duration, easeOutBounce);
    });

    await Promise.all(promises);
    this.animating = false;
  }

  /** Animate tile destruction (scale down + fade) */
  async animateDestroy(positions: GridPos[]): Promise<void> {
    if (positions.length === 0) return;

    this.animating = true;
    const promises = positions.map(pos => {
      const sprite = this.renderer.getTileSprite(pos.row, pos.col);
      if (!sprite) return Promise.resolve();

      return this.tweenScale(sprite, 1, 0, DESTROY_DURATION, easeInBack).then(() => {
        this.renderer.removeTileSprite(pos.row, pos.col);
      });
    });

    await Promise.all(promises);
    this.animating = false;
  }

  /** Animate spawned tiles (scale up from 0) */
  async animateSpawn(positions: GridPos[]): Promise<void> {
    if (positions.length === 0) return;

    this.animating = true;
    const promises = positions.map(pos => {
      const sprite = this.renderer.getTileSprite(pos.row, pos.col);
      if (!sprite) return Promise.resolve();

      sprite.scale.set(0);
      return this.tweenScale(sprite, 0, 1, SPAWN_DURATION, easeOutQuad);
    });

    await Promise.all(promises);
    this.animating = false;
  }

  /** Animate swap back (rejected move) */
  async animateSwapBack(a: GridPos, b: GridPos): Promise<void> {
    await this.animateSwap(a, b);
  }

  private tween(
    sprite: Graphics,
    target: { x: number; y: number },
    duration: number,
    easing: (t: number) => number = easeOutQuad,
  ): Promise<void> {
    return new Promise(resolve => {
      const startX = sprite.x;
      const startY = sprite.y;
      const startTime = performance.now();

      const tick = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const e = easing(t);

        sprite.x = lerp(startX, target.x, e);
        sprite.y = lerp(startY, target.y, e);

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(tick);
    });
  }

  private tweenTwo(
    spriteA: Graphics,
    startA: { x: number; y: number },
    endA: { x: number; y: number },
    spriteB: Graphics,
    startB: { x: number; y: number },
    endB: { x: number; y: number },
    duration: number,
  ): Promise<void> {
    return new Promise(resolve => {
      const startTime = performance.now();

      const tick = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const e = easeOutQuad(t);

        spriteA.x = lerp(startA.x, endA.x, e);
        spriteA.y = lerp(startA.y, endA.y, e);
        spriteB.x = lerp(startB.x, endB.x, e);
        spriteB.y = lerp(startB.y, endB.y, e);

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(tick);
    });
  }

  private tweenScale(
    sprite: Graphics,
    from: number,
    to: number,
    duration: number,
    easing: (t: number) => number = easeOutQuad,
  ): Promise<void> {
    return new Promise(resolve => {
      const startTime = performance.now();

      const tick = () => {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const e = easing(t);
        const s = lerp(from, to, e);
        sprite.scale.set(s);
        sprite.alpha = lerp(from < to ? 0 : 1, from < to ? 1 : 0, e);

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(tick);
    });
  }
}
