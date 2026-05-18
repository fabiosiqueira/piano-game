import { Midi } from "@tonejs/midi";
import type { MidiNote } from "../engine/types";

/**
 * Janela (s) para considerar duas notas de mesmo pitch como a mesma nota.
 * Arquivos MIDI às vezes trazem faixas duplicadas; sem isto, cada nota viraria
 * um acorde de dois blocos e o jogo ficaria injogável.
 */
const DUPLICATE_EPS = 0.03;

/** Remove notas duplicadas: mesmo pitch num intervalo menor que `DUPLICATE_EPS`. */
function dedupeNotes(sorted: readonly MidiNote[]): MidiNote[] {
  const lastTimeByMidi = new Map<number, number>();
  const result: MidiNote[] = [];
  for (const note of sorted) {
    const lastTime = lastTimeByMidi.get(note.midi);
    if (lastTime !== undefined && note.time - lastTime < DUPLICATE_EPS) {
      continue;
    }
    lastTimeByMidi.set(note.midi, note.time);
    result.push(note);
  }
  return result;
}

/**
 * Lê um arquivo MIDI e extrai as notas de todas as faixas, ordenadas por tempo.
 * Notas duplicadas (faixas repetidas) são descartadas.
 */
export function parseMidi(data: ArrayBuffer): MidiNote[] {
  const midi = new Midi(data);
  const notes: MidiNote[] = [];
  for (const track of midi.tracks) {
    for (const n of track.notes) {
      notes.push({ time: n.time, midi: n.midi, duration: n.duration });
    }
  }
  notes.sort((a, b) => a.time - b.time);
  return dedupeNotes(notes);
}
