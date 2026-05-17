import { describe, it, expect } from "vitest";
import { comboMultiplier, pointsFor } from "./score";
import type { HitQuality } from "./score";

describe("comboMultiplier", () => {
  it("multiplicador 1 abaixo de 10 de combo", () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(9)).toBe(1);
  });

  it("sobe 1 a cada 10 de combo", () => {
    expect(comboMultiplier(10)).toBe(2);
    expect(comboMultiplier(20)).toBe(3);
  });

  it("satura em 4", () => {
    expect(comboMultiplier(30)).toBe(4);
    expect(comboMultiplier(999)).toBe(4);
  });
});

describe("pointsFor", () => {
  it("perfect vale 100 vezes o multiplicador", () => {
    expect(pointsFor("perfect", 0)).toBe(100);
    expect(pointsFor("perfect", 10)).toBe(200);
  });

  it("good vale 50 vezes o multiplicador", () => {
    expect(pointsFor("good", 0)).toBe(50);
  });

  it("miss vale 0", () => {
    const miss: HitQuality = "miss";
    expect(pointsFor(miss, 30)).toBe(0);
  });
});
