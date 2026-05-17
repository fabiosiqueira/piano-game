import type { Beatmap, Tile } from "./types";
import { pointsFor } from "./score";
import type { HitQuality } from "./score";

/** Tolerância (em segundos) para um toque ser classificado como `perfect`. */
export const PERFECT_WINDOW = 0.08;
/** Tolerância (em segundos) para um toque ser classificado como `good`. */
export const GOOD_WINDOW = 0.18;

export interface GameState {
  readonly score: number;
  readonly combo: number;
  readonly maxCombo: number;
  readonly status: "playing" | "over";
  /** Quantidade de tiles acertados. */
  readonly hitCount: number;
  /** Total de tiles da beatmap. */
  readonly totalTiles: number;
}

type MutableGameState = {
  score: number;
  combo: number;
  maxCombo: number;
  status: "playing" | "over";
  hitCount: number;
  totalTiles: number;
};

/** Estado e regras de uma partida (modo clássico). Independente de UI. */
export class Game {
  private readonly tiles: Tile[];
  private readonly hit = new Set<number>();
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

  /** Registra um toque numa coluna no instante `nowSec`. */
  tap(lane: number, nowSec: number): HitQuality {
    if (this.mutableState.status === "over") return "miss";

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

    if (best === undefined || bestDelta > GOOD_WINDOW) {
      this.mutableState.combo = 0;
      this.mutableState.status = "over";
      return "miss";
    }

    this.hit.add(best.id);
    const quality: HitQuality =
      bestDelta <= PERFECT_WINDOW ? "perfect" : "good";
    this.mutableState.combo += 1;
    this.mutableState.maxCombo = Math.max(
      this.mutableState.maxCombo,
      this.mutableState.combo,
    );
    this.mutableState.hitCount += 1;
    this.mutableState.score += pointsFor(quality, this.mutableState.combo);
    return quality;
  }

  /** Avança o relógio: encerra o jogo se um tile passou, ou se todos foram tocados. */
  update(nowSec: number): void {
    if (this.mutableState.status === "over") return;

    for (const t of this.tiles) {
      if (this.hit.has(t.id)) continue;
      if (nowSec > t.time + GOOD_WINDOW) {
        this.mutableState.status = "over";
        return;
      }
    }

    if (this.hit.size === this.tiles.length) {
      this.mutableState.status = "over";
    }
  }
}
