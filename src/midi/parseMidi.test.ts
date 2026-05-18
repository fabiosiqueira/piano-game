import { describe, it, expect } from "vitest";
import { Midi } from "@tonejs/midi";
import { parseMidi } from "./parseMidi";

function sampleMidi(): ArrayBuffer {
  const midi = new Midi();
  const track = midi.addTrack();
  track.addNote({ midi: 60, time: 0, duration: 0.5 });
  track.addNote({ midi: 64, time: 1, duration: 0.25 });
  return midi.toArray().buffer as ArrayBuffer;
}

describe("parseMidi", () => {
  it("extrai notas com tempo, pitch e duração", () => {
    const notes = parseMidi(sampleMidi());
    expect(notes).toHaveLength(2);
    expect(notes[0].midi).toBe(60);
    expect(notes[0].time).toBeCloseTo(0);
    expect(notes[0].duration).toBeCloseTo(0.5);
    expect(notes[1].midi).toBe(64);
  });

  it("retorna lista vazia para MIDI sem notas", () => {
    const midi = new Midi();
    midi.addTrack();
    expect(parseMidi(midi.toArray().buffer as ArrayBuffer)).toEqual([]);
  });

  it("descarta notas duplicadas de faixas repetidas", () => {
    const midi = new Midi();
    for (let t = 0; t < 2; t++) {
      const track = midi.addTrack();
      track.addNote({ midi: 60, time: 0, duration: 0.5 });
      track.addNote({ midi: 64, time: 1, duration: 0.25 });
    }
    const notes = parseMidi(midi.toArray().buffer as ArrayBuffer);
    expect(notes).toHaveLength(2);
    expect(notes.map((n) => n.midi)).toEqual([60, 64]);
  });

  it("preserva notas simultâneas de pitches diferentes (acorde real)", () => {
    const midi = new Midi();
    const track = midi.addTrack();
    track.addNote({ midi: 60, time: 0, duration: 0.5 });
    track.addNote({ midi: 64, time: 0, duration: 0.5 });
    const notes = parseMidi(midi.toArray().buffer as ArrayBuffer);
    expect(notes).toHaveLength(2);
  });
});
