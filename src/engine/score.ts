/** Qualidade de um toque. */
export type HitQuality = "perfect" | "good" | "miss";

const BASE_POINTS: Record<HitQuality, number> = {
  perfect: 100,
  good: 50,
  miss: 0,
};

/** Multiplicador de combo: sobe 1 a cada 10 de combo, saturando em 4. */
export function comboMultiplier(combo: number): number {
  return Math.min(1 + Math.floor(combo / 10), 4);
}

/** Pontos de um toque, dado a qualidade e o combo atual (após o acerto). */
export function pointsFor(quality: HitQuality, combo: number): number {
  return BASE_POINTS[quality] * comboMultiplier(combo);
}

/** Bônus por segurar uma nota longa até o fim. */
export const LONG_NOTE_BONUS = 50;
