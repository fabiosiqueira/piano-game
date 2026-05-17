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
});
