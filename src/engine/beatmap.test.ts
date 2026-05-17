import { describe, it, expect } from "vitest";
import { generateBeatmap } from "./beatmap";
import type { MidiNote } from "./types";

const note = (time: number, midi = 60): MidiNote => ({
  time,
  midi,
  duration: 0.25,
});

describe("generateBeatmap", () => {
  it("beatmap vazia para lista vazia", () => {
    const bm = generateBeatmap([]);
    expect(bm.tiles).toEqual([]);
    expect(bm.durationSec).toBe(0);
  });

  it("distribui as 5 primeiras notas em colunas rotativas 0,1,2,3,0", () => {
    const notes = [note(0), note(1), note(2), note(3), note(4)];
    const lanes = generateBeatmap(notes).tiles.map((t) => t.lane);
    expect(lanes).toEqual([0, 1, 2, 3, 0]);
  });

  it("ordena por tempo e atribui ids sequenciais", () => {
    const notes = [note(2), note(0), note(1)];
    const tiles = generateBeatmap(notes).tiles;
    expect(tiles.map((t) => t.time)).toEqual([0, 1, 2]);
    expect(tiles.map((t) => t.id)).toEqual([0, 1, 2]);
  });

  it("preserva o pitch e calcula a duração total", () => {
    const bm = generateBeatmap([note(0, 64), note(3, 67)]);
    expect(bm.tiles[1].midi).toBe(67);
    expect(bm.durationSec).toBeCloseTo(3.25);
  });

  it("não repete a mesma coluna em duas notas consecutivas", () => {
    const notes = Array.from({ length: 20 }, (_, i) => note(i * 0.5));
    const lanes = generateBeatmap(notes).tiles.map((t) => t.lane);
    for (let i = 1; i < lanes.length; i++) {
      expect(lanes[i]).not.toBe(lanes[i - 1]);
    }
  });
});
