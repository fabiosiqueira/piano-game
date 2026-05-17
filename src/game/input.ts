/** Tecla → coluna do jogo. */
const KEY_TO_LANE: Readonly<Record<string, number>> = {
  d: 0,
  f: 1,
  j: 2,
  k: 3,
};

/** Coluna correspondente a uma tecla, ou `undefined` se não mapeada. */
export function keyToLane(key: string): number | undefined {
  return KEY_TO_LANE[key.toLowerCase()];
}

/** Nota de piano de fallback por coluna, quando a coluna não tem mais blocos. */
export const LANE_FALLBACK_MIDI: readonly number[] = [60, 62, 64, 65];
