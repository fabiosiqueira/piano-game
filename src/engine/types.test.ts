import { describe, it, expect } from "vitest";
import { LANE_COUNT } from "./types";
import type { MidiNote, Tile, Beatmap } from "./types";

describe("types", () => {
  it("expõe LANE_COUNT igual a 4", () => {
    expect(LANE_COUNT).toBe(4);
  });

  it("os tipos compõem uma beatmap válida", () => {
    const note: MidiNote = { time: 0, midi: 60, duration: 0.5 };
    const tile: Tile = { id: 0, time: note.time, lane: 0, midi: note.midi };
    const beatmap: Beatmap = { tiles: [tile], durationSec: 0.5 };
    expect(beatmap.tiles[0].lane).toBe(0);
  });
});
