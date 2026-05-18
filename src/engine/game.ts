import type { Beatmap, Tile } from "./types";
import { pointsFor, LONG_NOTE_BONUS } from "./score";
import type { HitQuality } from "./score";

/** Tolerância (s) para uma pressão ser `perfect`. */
export const PERFECT_WINDOW = 0.08;
/** Tolerância (s) para uma pressão ser `good`. */
export const GOOD_WINDOW = 0.18;
/** Quantidade de blocos perdidos que encerra a partida. */
export const MAX_MISSES = 3;

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  readonly score: number;
  readonly combo: number;
  readonly maxCombo: number;
  readonly status: GameStatus;
  /** Quantidade de blocos acertados. */
  readonly hitCount: number;
  /** Quantidade de blocos perdidos (passaram da linha sem toque). */
  readonly misses: number;
  /** Total de blocos da beatmap. */
  readonly totalTiles: number;
}

type MutableGameState = { -readonly [K in keyof GameState]: GameState[K] };

/** Estado e regras de uma partida. Independente de UI. */
export class Game {
  private readonly tiles: readonly Tile[];
  private readonly hit = new Set<number>();
  /** Blocos já contabilizados como perdidos (evita contar duas vezes). */
  private readonly missed = new Set<number>();
  /** Bloco longo atualmente segurado, por coluna. */
  private readonly held = new Map<number, Tile>();
  private readonly mutableState: MutableGameState;
  /** Tempo de queda do bloco (s): janela em que ele fica visível na tela. */
  private readonly fallSec: number;

  get state(): GameState {
    return this.mutableState;
  }

  constructor(beatmap: Beatmap, fallSec: number) {
    this.fallSec = fallSec;
    this.tiles = [...beatmap.tiles].sort((a, b) => a.time - b.time);
    this.mutableState = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      status: "playing",
      hitCount: 0,
      misses: 0,
      totalTiles: this.tiles.length,
    };
  }

  /** Indica se o bloco `id` já foi tocado — usado para sumir com ele na tela. */
  isHit(id: number): boolean {
    return this.hit.has(id);
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

  /**
   * Registra uma pressão numa coluna no instante `nowSec`.
   *
   * Modelo tolerante (estilo Magic Tiles): pressionar uma coluna cujo bloco-alvo
   * já está visível na tela conta como acerto — o timing só decide
   * `perfect`/`good`. Uma pressão sem bloco para acertar (coluna vazia, bloco
   * ainda fora da tela, ou bloco já passado) é apenas ignorada — nunca encerra
   * o jogo. A derrota só acontece em `update`, ao deixar um bloco passar.
   */
  press(lane: number, nowSec: number): HitQuality {
    if (this.mutableState.status !== "playing") return "miss";

    const target = this.peekTarget(lane, nowSec);
    if (target === undefined) return "miss"; // coluna sem bloco — ignora

    const delta = target.time - nowSec;
    if (delta > this.fallSec) return "miss"; // bloco ainda fora da tela — ignora
    if (-delta > GOOD_WINDOW) return "miss"; // bloco já passou da linha — ignora

    this.hit.add(target.id);
    this.held.set(lane, target);
    const quality: HitQuality =
      Math.abs(delta) <= PERFECT_WINDOW ? "perfect" : "good";
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

  /**
   * Avança o relógio. Cada bloco que passa da linha sem toque é contado como
   * perda e zera o combo; ao atingir `MAX_MISSES` é derrota. Quando todos os
   * blocos foram resolvidos (tocados ou perdidos) sem estourar o limite, vitória.
   */
  update(nowSec: number): void {
    if (this.mutableState.status !== "playing") return;

    for (const t of this.tiles) {
      if (this.hit.has(t.id) || this.missed.has(t.id)) continue;
      if (nowSec > t.time + GOOD_WINDOW) {
        this.missed.add(t.id);
        this.mutableState.misses += 1;
        this.mutableState.combo = 0;
      }
    }

    if (this.mutableState.misses >= MAX_MISSES) {
      this.mutableState.status = "lost";
      return;
    }

    const resolved = this.hit.size + this.missed.size;
    if (this.tiles.length > 0 && resolved === this.tiles.length) {
      this.mutableState.status = "won";
    }
  }
}
