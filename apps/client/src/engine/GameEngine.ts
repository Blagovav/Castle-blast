import { Application, Text, TextStyle, Container } from 'pixi.js';
import type { LevelDefinition } from '@castle-blast/shared';
import { Board } from './Board.js';
import { BoardRenderer } from './BoardRenderer.js';
import { MatchDetector } from './MatchDetector.js';
import { DeadBoardDetector } from './DeadBoardDetector.js';
import { SpecialTileLogic } from './SpecialTileLogic.js';
import { RngBias } from './RngBias.js';
import { LevelObjectiveTracker } from './LevelObjective.js';
import { InputHandler } from './InputHandler.js';
import { getBiomeForLevel } from './Biomes.js';
import type { GridPos, EngineEvents, TileType } from './types.js';

type EventName = keyof EngineEvents;
type EventCallback = (...args: any[]) => void;

export interface GameEngineOptions {
  container: HTMLElement;
  levelDef: LevelDefinition;
}

export class GameEngine {
  private app!: Application;
  private board!: Board;
  private renderer!: BoardRenderer;
  private matchDetector: MatchDetector;
  private deadBoardDetector: DeadBoardDetector;
  private specialTileLogic: SpecialTileLogic;
  private rngBias: RngBias;
  private objectiveTracker!: LevelObjectiveTracker;
  private inputHandler!: InputHandler;
  private levelDef: LevelDefinition;
  private container: HTMLElement;

  private movesLeft: number = 0;
  private score: number = 0;
  private processing: boolean = false;
  private paused: boolean = false;
  private listeners: Map<string, EventCallback[]> = new Map();

  constructor(options: GameEngineOptions) {
    this.container = options.container;
    this.levelDef = options.levelDef;

    this.matchDetector = new MatchDetector();
    this.deadBoardDetector = new DeadBoardDetector(this.matchDetector);
    this.specialTileLogic = new SpecialTileLogic();
    this.rngBias = new RngBias(this.matchDetector);
  }

  async init(): Promise<void> {
    const biomePreview = getBiomeForLevel(this.levelDef.level);
    this.app = new Application();
    await this.app.init({
      background: biomePreview.bgColor,
      resizeTo: this.container,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.container.appendChild(this.app.canvas as HTMLCanvasElement);

    // Create board with blockers
    const blockers = (this.levelDef as any).blockers ?? [];
    this.board = new Board(
      this.levelDef.gridWidth,
      this.levelDef.gridHeight,
      this.levelDef.blocked,
      this.levelDef.tileTypes,
      blockers,
    );

    // Get biome for this level
    const biome = getBiomeForLevel(this.levelDef.level);

    // Create renderer with biome theme
    this.renderer = new BoardRenderer(
      this.board,
      this.app.screen.width,
      this.app.screen.height,
      biome,
    );
    this.app.stage.addChild(this.renderer.container);

    // Create input handler
    this.inputHandler = new InputHandler(this.app, this.renderer, (a, b) => this.handleSwap(a, b));

    // Initialize game state
    this.movesLeft = this.levelDef.maxMoves;
    this.score = 0;
    this.objectiveTracker = new LevelObjectiveTracker(this.levelDef);

    // Preload sprites then render
    await this.renderer.preloadAndRender();

    // Ensure no dead board at start
    if (!this.deadBoardDetector.hasValidMoves(this.board)) {
      this.deadBoardDetector.reshuffle(this.board);
      this.renderer.renderAll();
    }
  }

  /** Handle a swap attempt */
  private async handleSwap(a: GridPos, b: GridPos): Promise<void> {
    if (this.processing || this.paused) return;
    if (!this.board.isActive(a.row, a.col) || !this.board.isActive(b.row, b.col)) return;
    if (!this.board.areAdjacent(a, b)) return;
    if (!this.board.getTile(a.row, a.col) || !this.board.getTile(b.row, b.col)) return;

    this.processing = true;
    this.inputHandler.setEnabled(false);

    // Animate swap visually first
    const spriteA = this.renderer.getTileSprite(a.row, a.col);
    const spriteB = this.renderer.getTileSprite(b.row, b.col);
    const pixA = this.renderer.gridToPixel(a.row, a.col);
    const pixB = this.renderer.gridToPixel(b.row, b.col);

    if (spriteA && spriteB) {
      await this.tweenSwap(spriteA, pixA, pixB, spriteB, pixB, pixA, 180);
    }

    // Perform swap on the board data
    this.board.swap(a, b);

    // Check for matches after swap
    const matches = this.matchDetector.findMatches(this.board);

    if (matches.length === 0) {
      // No match — swap back data
      this.board.swap(a, b);
      // Animate swap back
      if (spriteA && spriteB) {
        await this.tweenSwap(spriteA, pixB, pixA, spriteB, pixA, pixB, 180);
      }
      this.renderer.renderAll();
      this.emit('swapRejected', a, b);
      this.processing = false;
      this.inputHandler.setEnabled(true);
      return;
    }

    // Valid match — consume move
    this.movesLeft--;
    this.emit('moveUsed', this.movesLeft);

    // Re-render with swapped data
    this.renderer.renderAll();
    await this.delay(50);

    // Process all cascades
    await this.processCascades();

    // Check win/lose
    this.checkGameEnd();

    this.processing = false;
    this.inputHandler.setEnabled(true);
  }

  /** Process all cascades (match → remove → gravity → fill → repeat) */
  private async processCascades(): Promise<void> {
    let cascadeCount = 0;
    const maxCascades = 50; // Safety limit

    while (cascadeCount < maxCascades) {
      // Find matches
      const matches = this.matchDetector.findMatches(this.board);
      if (matches.length === 0) break;

      cascadeCount++;

      // Collect all matched positions
      const allPositions = this.matchDetector.getUniquePositions(matches);

      // Score: 10 points per tile, bonus for cascades
      const points = allPositions.length * 10 * cascadeCount;
      this.score += points;
      this.objectiveTracker.addScore(points);
      this.emit('scoreChanged', this.score);

      // Damage blockers adjacent to matched tiles
      this.damageAdjacentBlockers(allPositions);

      // Track collected tile types for objectives
      for (const pos of allPositions) {
        const tile = this.board.getTile(pos.row, pos.col);
        if (tile) {
          this.objectiveTracker.addCollected(tile.type, 1);
        }
      }

      // Determine specials to create
      const specialsToCreate: { pos: GridPos; type: TileType; special: string }[] = [];
      const intersections = this.matchDetector.detectIntersections(matches);

      // T/L intersections → bomb
      for (const iPos of intersections) {
        const tile = this.board.getTile(iPos.row, iPos.col);
        if (tile) {
          specialsToCreate.push({ pos: iPos, type: tile.type, special: 'bomb' });
        }
      }

      // Long matches → rockets
      const intersectionSet = new Set(intersections.map(p => `${p.row},${p.col}`));
      for (const match of matches) {
        const special = this.matchDetector.determineSpecial(match);
        if (special !== 'none') {
          const midIdx = Math.floor(match.positions.length / 2);
          const pos = match.positions[midIdx];
          if (!intersectionSet.has(`${pos.row},${pos.col}`)) {
            const tile = this.board.getTile(pos.row, pos.col);
            if (tile) {
              specialsToCreate.push({ pos, type: tile.type, special });
            }
          }
        }
      }

      // Activate any matched special tiles
      const extraPositions: GridPos[] = [];
      for (const pos of allPositions) {
        const tile = this.board.getTile(pos.row, pos.col);
        if (tile && tile.special !== 'none') {
          const affected = this.specialTileLogic.activate(this.board, pos);
          for (const ap of affected) {
            if (!allPositions.find(p => p.row === ap.row && p.col === ap.col) &&
                !extraPositions.find(p => p.row === ap.row && p.col === ap.col)) {
              extraPositions.push(ap);
            }
          }
          this.score += affected.length * 20;
          this.objectiveTracker.addScore(affected.length * 20);
          this.emit('scoreChanged', this.score);
        }
      }

      // Combine all positions to remove
      const allRemove = [...allPositions, ...extraPositions];
      const specialPosSet = new Set(specialsToCreate.map(s => `${s.pos.row},${s.pos.col}`));

      // Remove tiles (except ones being replaced by specials)
      for (const pos of allRemove) {
        if (!specialPosSet.has(`${pos.row},${pos.col}`)) {
          this.board.setTile(pos.row, pos.col, null);
        }
      }

      // Place created specials
      for (const { pos, type, special } of specialsToCreate) {
        this.board.setTile(pos.row, pos.col, { type, special: special as any });
      }

      // Show score popup at center of matched area
      if (allPositions.length > 0) {
        const avgRow = allPositions.reduce((s, p) => s + p.row, 0) / allPositions.length;
        const avgCol = allPositions.reduce((s, p) => s + p.col, 0) / allPositions.length;
        const pixPos = this.renderer.gridToPixel(Math.round(avgRow), Math.round(avgCol));
        const label = cascadeCount > 1 ? `+${points} x${cascadeCount}!` : `+${points}`;
        this.showScorePopup(label, pixPos.x, pixPos.y, cascadeCount > 1);
      }

      // Animate removal
      this.renderer.renderAll();
      await this.delay(180);

      // Apply gravity
      this.board.applyGravity();
      this.renderer.renderAll();
      await this.delay(100);

      // Fill empty cells with new tiles
      const biasedType = this.rngBias.getBiasedType(
        this.board,
        this.movesLeft,
        this.levelDef.rngBiasThreshold,
      );
      this.board.fillEmpty(biasedType);
      this.renderer.renderAll();
      await this.delay(100);
    }

    // Check for dead board
    if (!this.deadBoardDetector.hasValidMoves(this.board)) {
      this.deadBoardDetector.reshuffle(this.board);
      this.renderer.renderAll();
      this.emit('boardReshuffled');
    }
  }

  /** Check if the game has ended (win or lose) */
  private checkGameEnd(): void {
    if (this.objectiveTracker.isComplete()) {
      const starsEarned = this.objectiveTracker.getStarsEarned();
      this.emit('levelComplete', {
        score: this.score,
        movesUsed: this.levelDef.maxMoves - this.movesLeft,
        starsEarned: Math.max(starsEarned, 1),
        objectivesCompleted: true,
      });
    } else if (this.movesLeft <= 0) {
      this.emit('levelFailed');
    }
  }

  /** Damage blockers adjacent to matched positions */
  private damageAdjacentBlockers(matchedPositions: GridPos[]): void {
    const damaged = new Set<string>();
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const pos of matchedPositions) {
      for (const [dr, dc] of dirs) {
        const r = pos.row + dr;
        const c = pos.col + dc;
        const key = `${r},${c}`;
        if (damaged.has(key)) continue;

        const tile = this.board.getTile(r, c);
        if (tile && tile.blocker !== 'none' && tile.blockerHp > 0) {
          tile.blockerHp--;
          damaged.add(key);

          if (tile.blockerHp <= 0) {
            tile.blocker = 'none';
            this.emit('blockerBroken', { row: r, col: c }, tile.blocker);
            this.score += 50;
            this.objectiveTracker.addScore(50);
            this.emit('scoreChanged', this.score);

            // Show popup for blocker break
            const pix = this.renderer.gridToPixel(r, c);
            this.showScorePopup('BREAK!', pix.x, pix.y, true);
          }
        }
      }
    }
  }

  /** Animate two sprites swapping positions */
  private tweenSwap(
    spriteA: Container, fromA: { x: number; y: number }, toA: { x: number; y: number },
    spriteB: Container, fromB: { x: number; y: number }, toB: { x: number; y: number },
    durationMs: number,
  ): Promise<void> {
    return new Promise(resolve => {
      const start = performance.now();
      const tick = () => {
        const elapsed = performance.now() - start;
        const t = Math.min(elapsed / durationMs, 1);
        const e = 1 - (1 - t) * (1 - t); // easeOutQuad
        spriteA.x = fromA.x + (toA.x - fromA.x) * e;
        spriteA.y = fromA.y + (toA.y - fromA.y) * e;
        spriteB.x = fromB.x + (toB.x - fromB.x) * e;
        spriteB.y = fromB.y + (toB.y - fromB.y) * e;
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  /** Show floating score popup at position */
  private showScorePopup(text: string, x: number, y: number, isCombo: boolean): void {
    const style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: isCombo ? 22 : 16,
      fontWeight: 'bold',
      fill: isCombo ? '#ffd700' : '#ffffff',
      stroke: { color: '#000000', width: 3 },
      dropShadow: { color: '#000000', blur: 2, distance: 1 },
    });
    const label = new Text({ text, style });
    label.anchor.set(0.5);
    label.position.set(x, y);
    label.alpha = 1;
    this.renderer.effectsContainer.addChild(label);

    // Animate floating up and fading
    const startY = y;
    const startTime = performance.now();
    const duration = 800;
    const tick = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      label.y = startY - 40 * t;
      label.alpha = 1 - t * t;
      if (isCombo) label.scale.set(1 + t * 0.3);
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        label.removeFromParent();
        label.destroy();
      }
    };
    requestAnimationFrame(tick);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Event emitter
  on<E extends EventName>(event: E, callback: EngineEvents[E]): void {
    const list = this.listeners.get(event) ?? [];
    list.push(callback as EventCallback);
    this.listeners.set(event, list);
  }

  off<E extends EventName>(event: E, callback: EngineEvents[E]): void {
    const list = this.listeners.get(event);
    if (list) {
      const idx = list.indexOf(callback as EventCallback);
      if (idx >= 0) list.splice(idx, 1);
    }
  }

  private emit(event: string, ...args: any[]): void {
    const list = this.listeners.get(event);
    if (list) {
      for (const cb of list) {
        cb(...args);
      }
    }
  }

  // Public API
  pause(): void {
    this.paused = true;
    this.inputHandler.setEnabled(false);
  }

  resume(): void {
    this.paused = false;
    if (!this.processing) {
      this.inputHandler.setEnabled(true);
    }
  }

  getScore(): number {
    return this.score;
  }

  getMovesLeft(): number {
    return this.movesLeft;
  }

  addMoves(count: number): void {
    this.movesLeft += count;
    this.emit('moveUsed', this.movesLeft);
  }

  destroy(): void {
    this.inputHandler?.destroy();
    this.renderer?.destroy();
    this.app?.destroy(true, { children: true });
    this.listeners.clear();
  }
}
