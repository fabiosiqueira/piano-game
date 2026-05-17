import { describe, it, expect } from "vitest";
import { DIFFICULTY } from "./difficulty";
import type { DifficultyKey } from "./difficulty";

describe("DIFFICULTY", () => {
  it("expõe os três níveis", () => {
    const keys: DifficultyKey[] = ["lento", "medio", "rapido"];
    expect(Object.keys(DIFFICULTY).sort()).toEqual([...keys].sort());
  });

  it("cada nível tem label e fallSec positivo", () => {
    for (const key of Object.keys(DIFFICULTY) as DifficultyKey[]) {
      expect(typeof DIFFICULTY[key].label).toBe("string");
      expect(DIFFICULTY[key].fallSec).toBeGreaterThan(0);
    }
  });

  it("lento é mais lento que rápido", () => {
    expect(DIFFICULTY.lento.fallSec).toBeGreaterThan(DIFFICULTY.rapido.fallSec);
  });
});
