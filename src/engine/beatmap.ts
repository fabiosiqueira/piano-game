import { LANE_COUNT } from "./types";
import type { MidiNote, Tile, Beatmap } from "./types";

/**
 * Gera uma beatmap a partir de notas MIDI.
 * Cada nota é atribuída à coluna usada há mais tempo (argmin do último uso),
 * o que espalha as notas e evita repetir a mesma coluna em notas próximas.
 */
export function generateBeatmap(notes: MidiNote[]): Beatmap {
  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const lastUsed: number[] = new Array(LANE_COUNT).fill(-Infinity);
  const tiles: Tile[] = [];

  sorted.forEach((n, index) => {
    let lane = 0;
    for (let l = 1; l < LANE_COUNT; l++) {
      if (lastUsed[l] < lastUsed[lane]) lane = l;
    }
    lastUsed[lane] = n.time;
    tiles.push({ id: index, time: n.time, lane, midi: n.midi });
  });

  const last = sorted[sorted.length - 1];
  const durationSec = last ? last.time + last.duration : 0;

  return { tiles, durationSec };
}
