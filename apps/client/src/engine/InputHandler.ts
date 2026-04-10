import type { Application } from 'pixi.js';
import type { BoardRenderer } from './BoardRenderer.js';
import type { GridPos } from './types.js';

export type SwapCallback = (a: GridPos, b: GridPos) => void;

const MIN_SWIPE_DISTANCE = 10; // pixels

export class InputHandler {
  private renderer: BoardRenderer;
  private onSwap: SwapCallback;
  private startPos: { x: number; y: number } | null = null;
  private startGrid: GridPos | null = null;
  private enabled: boolean = true;
  private app: Application;

  constructor(app: Application, renderer: BoardRenderer, onSwap: SwapCallback) {
    this.app = app;
    this.renderer = renderer;
    this.onSwap = onSwap;

    this.setupEvents();
  }

  private setupEvents(): void {
    const stage = this.app.stage;
    stage.eventMode = 'static';
    stage.hitArea = this.app.screen;

    stage.on('pointerdown', this.onPointerDown, this);
    stage.on('pointerup', this.onPointerUp, this);
    stage.on('pointerupoutside', this.onPointerUp, this);
  }

  private onPointerDown(e: any): void {
    if (!this.enabled) return;

    const pos = e.global;
    this.startPos = { x: pos.x, y: pos.y };
    this.startGrid = this.renderer.pixelToGrid(pos.x, pos.y);
  }

  private onPointerUp(e: any): void {
    if (!this.enabled || !this.startPos || !this.startGrid) {
      this.reset();
      return;
    }

    const pos = e.global;
    const dx = pos.x - this.startPos.x;
    const dy = pos.y - this.startPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < MIN_SWIPE_DISTANCE) {
      this.reset();
      return;
    }

    // Determine swipe direction
    let targetGrid: GridPos;
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      targetGrid = {
        row: this.startGrid.row,
        col: this.startGrid.col + (dx > 0 ? 1 : -1),
      };
    } else {
      // Vertical swipe
      targetGrid = {
        row: this.startGrid.row + (dy > 0 ? 1 : -1),
        col: this.startGrid.col,
      };
    }

    this.onSwap(this.startGrid, targetGrid);
    this.reset();
  }

  private reset(): void {
    this.startPos = null;
    this.startGrid = null;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  destroy(): void {
    const stage = this.app.stage;
    stage.off('pointerdown', this.onPointerDown, this);
    stage.off('pointerup', this.onPointerUp, this);
    stage.off('pointerupoutside', this.onPointerUp, this);
  }
}
