import { describe, it, expect, vi } from "vitest";

vi.mock("tone", () => {
  const sampler = {
    toDestination() {
      return this;
    },
    triggerAttackRelease: vi.fn(),
  };
  return {
    start: vi.fn().mockResolvedValue(undefined),
    loaded: vi.fn().mockResolvedValue(undefined),
    Sampler: vi.fn(() => sampler),
    Frequency: () => ({ toFrequency: () => 440 }),
  };
});

import { Piano } from "./piano";

describe("Piano", () => {
  it("play antes de load não lança", () => {
    const piano = new Piano();
    expect(() => piano.play(60)).not.toThrow();
  });

  it("carrega e toca sem erro", async () => {
    const piano = new Piano();
    await piano.load();
    expect(() => piano.play(60)).not.toThrow();
  });
});
