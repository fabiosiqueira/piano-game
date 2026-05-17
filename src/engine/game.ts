import type { Beatmap, Tile } from "./types";
import { pointsFor, LONG_NOTE_BONUS } from "./score";
import type { HitQuality } from "./score";

/** Tolerância (s) para uma pressão ser `perfect`. */
export const PERFECT_WINDOW = 0.08;
/** Tolerância (s) para uma pressão ser `good`. */
export const GOOD_WINDOW = 0.18;

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  readonly score: number;
  readonly combo: number;
  readonly maxCombo: number;
  readonly status: GameStatus;
  /** Quantidade de blocos acertados. */
  readonly hitCount: number;
  /** Total de blocos da beatmap. */
  readonly totalTiles: number;
}

type MutableGameState = { -readonly [K in keyof GameState]: GameState[K] };

/** Estado e regras de uma partida. Independente de UI. */
export class Game {
  private readonly tiles: readonly Tile[];
  private readonly hit = new Set<number>();
  /** Bloco longo atualmente segurado, por coluna. */
  private readonly held = new Map<number, Tile>();
  private readonly mutableState: MutableGameState;

  get state(): GameState {
    return this.mutableState;
  }

  constructor(beatmap: Beatmap) {
    this.tiles = [...beatmap.tiles].sort((a, b) => a.time - b.time);
    this.mutableState = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      status: "playing",
      hitCount: 0,
      totalTiles: this.tiles.length,
    };
  }

  /** Bloco não-tocado mais próximo de `nowSec` naquela coluna. */
  peekTarget(lane: number, nowSec: number): Tile | undefined {
    let best: Tile | undefined;
    let bestDelta = Infinity;
    for (const t of this.tiles) {
      if (t.lane !== lane || this.hit.has(t.id)) continue;
      const delta = Math.abs(t.time - nowSec);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = t;
      }
    }
    return best;
  }

  /** Registra uma pressão numa coluna no instante `nowSec`. */
  press(lane: number, nowSec: number): HitQuality {
    if (this.mutableState.status !== "playing") return "miss";

    const target = this.peekTarget(lane, nowSec);
    const delta = target ? Math.abs(target.time - nowSec) : Infinity;

    if (target === undefined || delta > GOOD_WINDOW) {
      this.mutableState.combo = 0;
      this.mutableState.status = "lost";
      return "miss";
    }

    this.hit.add(target.id);
    this.held.set(lane, target);
    const quality: HitQuality = delta <= PERFECT_WINDOW ? "perfect" : "good";
    this.mutableState.combo += 1;
    this.mutableState.maxCombo = Math.max(
      this.mutableState.maxCombo,
      this.mutableState.combo,
    );
    this.mutableState.hitCount += 1;
    this.mutableState.score += pointsFor(quality, this.mutableState.combo);
    return quality;
  }

  /** Registra o soltar de uma coluna. Dá bônus se a nota longa foi segurada. */
  release(lane: number, nowSec: number): void {
    const tile = this.held.get(lane);
    if (tile === undefined) return;
    this.held.delete(lane);
    if (this.mutableState.status !== "playing") return;
    const heldEnough = nowSec >= tile.time + tile.durationSec - GOOD_WINDOW;
    if (heldEnough) {
      this.mutableState.score += LONG_NOTE_BONUS;
    }
  }

  /** Avança o relógio: derrota se um bloco passou, vitória se todos foram tocados. */
  update(nowSec: number): void {
    if (this.mutableState.status !== "playing") return;

    for (const t of this.tiles) {
      if (this.hit.has(t.id)) continue;
      if (nowSec > t.time + GOOD_WINDOW) {
        this.mutableState.status = "lost";
        return;
      }
    }

    if (this.tiles.length > 0 && this.hit.size === this.tiles.length) {
      this.mutableState.status = "won";
    }
  }
}
