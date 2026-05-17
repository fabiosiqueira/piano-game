/** Número fixo de colunas do jogo. */
export const LANE_COUNT = 4;

/** Nota crua extraída de um arquivo MIDI (formato @tonejs/midi). */
export interface MidiNote {
  /** Instante de início, em segundos. */
  time: number;
  /** Altura da nota (pitch MIDI 0-127). */
  midi: number;
  /** Duração da nota, em segundos. */
  duration: number;
}

/** Um tile que cai numa coluna e deve ser tocado em `time`. */
export interface Tile {
  /** Identificador único e estável dentro da beatmap. */
  id: number;
  /** Instante em que o tile cruza a linha de acerto, em segundos. */
  time: number;
  /** Coluna 0..LANE_COUNT-1. */
  lane: number;
  /** Pitch MIDI, usado depois para tocar o som de piano. */
  midi: number;
}

/** Beatmap completa de uma música. */
export interface Beatmap {
  tiles: Tile[];
  /** Duração total da música, em segundos. */
  durationSec: number;
}
