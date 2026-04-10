import { Application } from 'pixi.js';
import type { LevelDefinition } from '@castle-blast/shared';
import { Board } from './Board.js';
import { BoardRenderer } from './BoardRenderer.js';
import { MatchDetector } from './MatchDetector.js';
import { CascadeResolver } from './CascadeResolver.js';
import { DeadBoardDetector } from './DeadBoardDetector.js';
import { SpecialTileLogic } from './SpecialTileLogic.js';
import { RngBias } from './RngBias.js';
import { LevelObjectiveTracker } from './LevelObjective.js';
import { InputHandler } from './InputHandler.js';
import { AnimationManager } from './AnimationManager.js';
import type { GridPos, EngineEvents } from './types.js';

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
  private cascadeResolver: CascadeResolver;
  private deadBoardDetector: DeadBoardDetector;
  private specialTileLogic: SpecialTileLogic;
  private rngBias: RngBias;
  private objectiveTracker!: LevelObjectiveTracker;
  private inputHandler!: InputHandler;
  private animationManager!: AnimationManager;
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
    this.cascadeResolver = new CascadeResolver(this.matchDetector);
    this.deadBoardDetector = new DeadBoardDetector(this.matchDetector);
    this.specialTileLogic = new SpecialTileLogic();
    this.rngBias = new RngBias(this.matchDetector);
  }

  async init(): Promise<void> {
    this.app = new Application();
    await this.app.init({
      background: 0x1a1a2e,
      resizeTo: this.container,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.container.appendChild(this.app.canvas as HTMLCanvasElement);

    // Create board
    this.board = new Board(
      this.levelDef.gridWidth,
      this.levelDef.gridHeight,
      this.levelDef.blocked,
      this.levelDef.tileTypes,
    );

    // Create renderer
    this.renderer = new BoardRenderer(
      this.board,
      this.app.screen.width,
      this.app.screen.height,
    );
    this.app.stage.addChild(this.renderer.container);

    // Create animation manager
    this.animationManager = new AnimationManager(this.renderer);

    // Create input handler
    this.inputHandler = new InputHandler(this.app, this.renderer, (a, b) => this.handleSwap(a, b));

    // Initialize game state
    this.movesLeft = this.levelDef.maxMoves;
    this.score = 0;
    this.objectiveTracker = new LevelObjectiveTracker(this.levelDef);

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

    // Check for special+special combo
    const tileA = this.board.getTile(a.row, a.col)!;
    const tileB = this.board.getTile(b.row, b.col)!;

    if (tileA.special !== 'none' && tileB.special !== 'none') {
      await this.handleCombo(a, b);
      this.processing = false;
      this.inputHandler.setEnabled(true);
      return;
    }

    // Perform swap
    this.board.swap(a, b);
    await this.animationManager.animateSwap(a, b);

    // Check for matches
    const matches = this.matchDetector.findMatches(this.board);

    if (matches.length === 0) {
      // No match — swap back
      this.board.swap(a, b);
      this.renderer.renderAll(); // Re-render to fix sprite positions
      this.emit('swapRejected', a, b);
      this.processing = false;
      this.inputHandler.setEnabled(true);
      return;
    }

    // Valid match — consume move
    this.movesLeft--;
    this.emit('moveUsed', this.movesLeft);
    this.emit('tileSwapped', a, b);

    // Process cascades
    await this.processCascades();

    // Check win/lose
    this.checkGameEnd();

    this.processing = false;
    this.inputHandler.setEnabled(true);
  }

  /** Handle combo when two special tiles are swapped */
  private async handleCombo(a: GridPos, b: GridPos): Promise<void> {
    this.movesLeft--;
    this.emit('moveUsed', this.movesLeft);

    const affected = this.specialTileLogic.combo(this.board, a, b);
    const points = affected.length * 30;
    this.score += points;
    this.objectiveTracker.addScore(points);
    this.emit('scoreChanged', this.score);

    // Animate destruction
    await this.animationManager.animateDestroy(affected);
    this.board.removeTiles(affected);

    // Cascade
    await this.processCascades();
    this.checkGameEnd();
  }

  /** Process all cascades (gravity + fill + match + repeat) */
  private async processCascades(): Promise<void> {
    let hasMatches = true;

    while (hasMatches) {
      // Find current matches
      const matches = this.matchDetector.findMatches(this.board);
      if (matches.length === 0) {
        hasMatches = false;
        break;
      }

      // Calculate score
      const allPositions = this.matchDetector.getUniquePositions(matches);
      const points = allPositions.length * 10;
      this.score += points;
      this.objectiveTracker.addScore(points);
      this.emit('scoreChanged', this.score);

      // Track collected tile types
      for (const pos of allPositions) {
        const tile = this.board.getTile(pos.row, pos.col);
        if (tile) {
          this.objectiveTracker.addCollected(tile.type, 1);
        }
      }

      // Check for specials to create
      const intersections = this.matchDetector.detectIntersections(matches);
      const specialsToCreate: { pos: GridPos; type: number; special: string }[] = [];

      for (const iPos of intersections) {
        const tile = this.board.getTile(iPos.row, iPos.col);
        if (tile) {
          specialsToCreate.push({ pos: iPos, type: tile.type, special: 'bomb' });
        }
      }

      for (const match of matches) {
        const special = this.matchDetector.determineSpecial(match);
        if (special !== 'none') {
          const midIdx = Math.floor(match.positions.length / 2);
          const pos = match.positions[midIdx];
          if (!intersections.find(p => p.row === pos.row && p.col === pos.col)) {
            const tile = this.board.getTile(pos.row, pos.col);
            if (tile) {
              specialsToCreate.push({ pos, type: tile.type, special });
            }
          }
        }
      }

      // Check if any matched tiles are specials (activate them)
      for (const pos of allPositions) {
        const tile = this.board.getTile(pos.row, pos.col);
        if (tile && tile.special !== 'none') {
          const affected = this.specialTileLogic.activate(this.board, pos);
          for (const ap of affected) {
            if (!allPositions.find(p => p.row === ap.row && p.col === ap.col)) {
              allPositions.push(ap);
            }
          }
          this.score += affected.length * 20;
          this.objectiveTracker.addScore(affected.length * 20);
          this.emit('scoreChanged', this.score);
        }
      }

      // Animate destruction
      await this.animationManager.animateDestroy(allPositions);

      // Remove tiles from board (except specials being created)
      const specialPosSet = new Set(specialsToCreate.map(s => `${s.pos.row},${s.pos.col}`));
      for (const pos of allPositions) {
        if (!specialPosSet.has(`${pos.row},${pos.col}`)) {
          this.board.removeTiles([pos]);
        }
      }

      // Create specials
      for (const { pos, type, special } of specialsToCreate) {
        this.board.setTile(pos.row, pos.col, { type: type as any, special: special as any });
      }

      // Apply gravity
      const fallen = this.board.applyGravity();

      // Get biased type for RNG if player is struggling
      const biasedType = this.rngBias.getBiasedType(
        this.board,
        this.movesLeft,
        this.levelDef.rngBiasThreshold,
      );

      // Fill empty cells
      const spawned = this.board.fillEmpty(biasedType);

      // Re-render everything (simpler and more reliable than incremental updates)
      this.renderer.renderAll();

      // Animate fall
      // For simplicity in this first version, we just re-render.
      // TODO: Implement incremental animation for smoother cascades
      await this.delay(200); // Brief pause between cascade steps
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
