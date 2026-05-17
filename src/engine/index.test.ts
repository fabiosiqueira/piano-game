import { describe, it, expect } from "vitest";
import { Game, generateBeatmap, DIFFICULTY, LANE_COUNT } from "./index";

describe("engine barrel", () => {
  it("reexporta a API pública da engine", () => {
    expect(typeof Game).toBe("function");
    expect(typeof generateBeatmap).toBe("function");
    expect(LANE_COUNT).toBe(4);
    expect(DIFFICULTY.medio.fallSec).toBeGreaterThan(0);
  });
});
