import type { Beatmap, Tile } from "./types";
import { pointsFor } from "./score";
import type { HitQuality } from "./score";

/** Tolerância (em segundos) para um toque ser classificado como `perfect`. */
export const PERFECT_WINDOW = 0.08;
/** Tolerância (em segundos) para um toque ser classificado como `good`. */
export const GOOD_WINDOW = 0.18;

export interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  status: "playing" | "over";
  /** Quantidade de tiles acertados. */
  hitCount: number;
  /** Total de tiles da beatmap. */
  totalTiles: number;
}

/** Estado e regras de uma partida (modo clássico). Independente de UI. */
export class Game {
  private readonly tiles: Tile[];
  private readonly hit = new Set<number>();
  readonly state: GameState;

  constructor(beatmap: Beatmap) {
    this.tiles = [...beatmap.tiles].sort((a, b) => a.time - b.time);
    this.state = {
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
    if (this.state.status === "over") return "miss";

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
      this.state.combo = 0;
      this.state.status = "over";
      return "miss";
    }

    this.hit.add(best.id);
    const quality: HitQuality =
      bestDelta <= PERFECT_WINDOW ? "perfect" : "good";
    this.state.combo += 1;
    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
    this.state.hitCount += 1;
    this.state.score += pointsFor(quality, this.state.combo);
    return quality;
  }

  /** Avança o relógio: encerra o jogo se um tile passou, ou se todos foram tocados. */
  update(nowSec: number): void {
    if (this.state.status === "over") return;

    for (const t of this.tiles) {
      if (this.hit.has(t.id)) continue;
      if (nowSec > t.time + GOOD_WINDOW) {
        this.state.status = "over";
        return;
      }
    }

    if (this.hit.size === this.tiles.length) {
      this.state.status = "over";
    }
  }
}
