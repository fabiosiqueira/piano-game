/**
 * Tempo de queda (segundos) de cada nível. Único ponto a ajustar para
 * mudar a velocidade do jogo — não afeta a beatmap.
 */
export const DIFFICULTY = {
  lento: { label: "Lento", fallSec: 3.4 },
  medio: { label: "Médio", fallSec: 2.3 },
  rapido: { label: "Rápido", fallSec: 1.5 },
} as const;

export type DifficultyKey = keyof typeof DIFFICULTY;
