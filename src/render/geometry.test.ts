import { describe, it, expect } from "vitest";
import { laneLayout, tileBox, visibleTiles, MIN_TILE_PX } from "./geometry";

describe("laneLayout", () => {
  it("calcula linha de acerto e velocidade a partir do fallSec", () => {
    const layout = laneLayout(360, 640, 2);
    expect(layout.hitLineY).toBeGreaterThan(0);
    expect(layout.hitLineY).toBeLessThan(640);
    expect(layout.pixelsPerSecond).toBeCloseTo(layout.hitLineY / 2);
  });
});

describe("tileBox", () => {
  it("o fundo do bloco fica na linha de acerto quando now == time", () => {
    const layout = laneLayout(360, 640, 2);
    const box = tileBox(1.0, 0.5, 1.0, layout);
    expect(box.topY + box.heightPx).toBeCloseTo(layout.hitLineY);
  });

  it("respeita a altura mínima do bloco", () => {
    const layout = laneLayout(360, 640, 2);
    const box = tileBox(1.0, 0.001, 1.0, layout);
    expect(box.heightPx).toBe(MIN_TILE_PX);
  });
});

describe("visibleTiles", () => {
  it("descarta blocos fora da tela e mantém os visíveis", () => {
    const layout = laneLayout(360, 640, 2);
    const tiles = [
      { lane: 0, time: 1.0, durationSec: 0.5 }, // na linha — visível
      { lane: 1, time: 100, durationSec: 0.5 }, // muito longe — fora
    ];
    const result = visibleTiles(tiles, 1.0, layout);
    expect(result).toHaveLength(1);
    expect(result[0].lane).toBe(0);
  });
});
