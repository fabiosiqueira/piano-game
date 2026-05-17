import { Midi } from "@tonejs/midi";
import type { MidiNote } from "../engine/types";

/** Lê um arquivo MIDI e extrai as notas de todas as faixas, ordenadas por tempo. */
export function parseMidi(data: ArrayBuffer): MidiNote[] {
  const midi = new Midi(data);
  const notes: MidiNote[] = [];
  for (const track of midi.tracks) {
    for (const n of track.notes) {
      notes.push({ time: n.time, midi: n.midi, duration: n.duration });
    }
  }
  return notes.sort((a, b) => a.time - b.time);
}
