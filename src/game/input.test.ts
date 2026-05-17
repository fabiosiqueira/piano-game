import { describe, it, expect } from "vitest";
import { keyToLane, LANE_FALLBACK_MIDI } from "./input";

describe("keyToLane", () => {
  it("mapeia D/F/J/K para as colunas 0..3", () => {
    expect(keyToLane("d")).toBe(0);
    expect(keyToLane("f")).toBe(1);
    expect(keyToLane("j")).toBe(2);
    expect(keyToLane("k")).toBe(3);
  });

  it("é insensível a maiúsculas", () => {
    expect(keyToLane("K")).toBe(3);
  });

  it("retorna undefined para teclas não mapeadas", () => {
    expect(keyToLane("a")).toBeUndefined();
  });
});

describe("LANE_FALLBACK_MIDI", () => {
  it("tem uma nota de fallback por coluna", () => {
    expect(LANE_FALLBACK_MIDI).toHaveLength(4);
  });
});
