import { Game } from "../engine/game";
import type { GameState } from "../engine/game";
import { LANE_COUNT } from "../engine/types";
import type { Beatmap } from "../engine/types";
import { laneLayout, visibleTiles } from "../render/geometry";
import type { LaneLayout } from "../render/geometry";
import { drawFrame } from "../render/renderer";
import type { IPiano } from "../audio/piano";
import { LANE_FALLBACK_MIDI } from "./input";

export interface GameLoopResult {
  readonly status: "won" | "lost";
  readonly state: GameState;
}

export interface GameLoopOptions {
  readonly beatmap: Beatmap;
  readonly fallSec: number;
  readonly canvas: HTMLCanvasElement;
  readonly piano: IPiano;
  readonly onEnd: (result: GameLoopResult) => void;
}

/** Orquestra relógio + engine + render + áudio + input da partida. */
export class GameLoop {
  private readonly game: Game;
  private readonly options: GameLoopOptions;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly layout: LaneLayout;
  private startedAt = 0;
  private elapsedBeforePause: number;
  private rafId = 0;
  private running = false;

  constructor(options: GameLoopOptions) {
    this.options = options;
    this.game = new Game(options.beatmap, options.fallSec);
    // Lead-in: o relógio começa em -fallSec para que o primeiro bloco caia do
    // topo até a linha de acerto, em vez de nascer já sobre ela.
    this.elapsedBeforePause = -options.fallSec;
    const ctx = options.canvas.getContext("2d");
    if (ctx === null) throw new Error("Contexto 2D do Canvas indisponível");
    this.ctx = ctx;
    this.layout = laneLayout(
      options.canvas.width,
      options.canvas.height,
      options.fallSec,
    );
  }

  get state(): GameState {
    return this.game.state;
  }

  /** Tempo decorrido de jogo, em segundos. */
  private now(): number {
    if (!this.running) return this.elapsedBeforePause;
    return (
      this.elapsedBeforePause + (performance.now() - this.startedAt) / 1000
    );
  }

  start(): void {
    this.running = true;
    this.startedAt = performance.now();
    this.frame();
  }

  pause(): void {
    if (!this.running) return;
    this.elapsedBeforePause = this.now();
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  resume(): void {
    if (this.running) return;
    this.running = true;
    this.startedAt = performance.now();
    this.frame();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  pressLane(lane: number): void {
    const now = this.now();
    const target = this.game.peekTarget(lane, now);
    this.options.piano.play(target?.midi ?? LANE_FALLBACK_MIDI[lane]);
    this.game.press(lane, now);
  }

  releaseLane(lane: number): void {
    this.game.release(lane, this.now());
  }

  private frame(): void {
    const now = this.now();
    this.game.update(now);
    this.render(now);

    const status = this.game.state.status;
    if (status !== "playing") {
      this.stop();
      this.options.onEnd({ status, state: this.game.state });
      return;
    }
    if (this.running) {
      this.rafId = requestAnimationFrame(() => this.frame());
    }
  }

  private render(now: number): void {
    // Blocos já tocados somem da tela; só os pendentes são desenhados.
    const pending = this.options.beatmap.tiles.filter(
      (t) => !this.game.isHit(t.id),
    );
    const tiles = visibleTiles(pending, now, this.layout);
    drawFrame(this.ctx, {
      width: this.layout.width,
      height: this.layout.height,
      hitLineY: this.layout.hitLineY,
      laneCount: LANE_COUNT,
      tiles,
    });
  }
}
