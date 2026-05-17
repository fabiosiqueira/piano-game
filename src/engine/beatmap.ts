import { LANE_COUNT } from "./types";
import type { MidiNote, Tile, Beatmap } from "./types";

/** Notas dentro desta janela (s) contam como simultâneas (acorde). */
const SIMULTANEITY_EPS = 0.01;
/** Máximo de blocos simultâneos — duas mãos da criança. */
const MAX_SIMULTANEOUS = 2;

/**
 * Gera uma beatmap a partir de notas MIDI.
 * Notas simultâneas viram um acorde de até 2 colunas distintas; o restante
 * é descartado. Notas não-simultâneas vão para a coluna usada há mais tempo.
 */
export function generateBeatmap(notes: MidiNote[]): Beatmap {
  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const lastUsed: number[] = new Array(LANE_COUNT).fill(-Infinity);
  const tiles: Tile[] = [];
  let id = 0;
  let i = 0;

  while (i < sorted.length) {
    const groupTime = sorted[i].time;
    const group: MidiNote[] = [];
    while (
      i < sorted.length &&
      sorted[i].time - groupTime <= SIMULTANEITY_EPS
    ) {
      group.push(sorted[i]);
      i++;
    }
    const chosen = group.slice(0, MAX_SIMULTANEOUS);
    const usedLanes = new Set<number>();
    for (const noteOfGroup of chosen) {
      let lane = -1;
      for (let l = 0; l < LANE_COUNT; l++) {
        if (usedLanes.has(l)) continue;
        if (lane === -1 || lastUsed[l] < lastUsed[lane]) lane = l;
      }
      usedLanes.add(lane);
      lastUsed[lane] = noteOfGroup.time;
      tiles.push({
        id: id++,
        time: noteOfGroup.time,
        lane,
        midi: noteOfGroup.midi,
        durationSec: noteOfGroup.duration,
      });
    }
  }

  const last = sorted[sorted.length - 1];
  const durationSec = last ? last.time + last.duration : 0;
  return { tiles, durationSec };
}
