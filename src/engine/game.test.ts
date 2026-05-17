import { describe, it, expect } from "vitest";
import { Game, PERFECT_WINDOW, GOOD_WINDOW } from "./game";
import type { Beatmap } from "./types";

const beatmap = (...times: number[]): Beatmap => ({
  tiles: times.map((time, id) => ({ id, time, lane: id % 4, midi: 60 })),
  durationSec: Math.max(0, ...times) + 1,
});

describe("Game.tap", () => {
  it("toque dentro da janela perfeita conta perfect", () => {
    const g = new Game(beatmap(1.0));
    expect(g.tap(0, 1.0 + PERFECT_WINDOW / 2)).toBe("perfect");
    expect(g.state.combo).toBe(1);
    expect(g.state.score).toBe(100);
  });

  it("toque fora da janela perfeita mas dentro da boa conta good", () => {
    const g = new Game(beatmap(1.0));
    expect(g.tap(0, 1.0 + (PERFECT_WINDOW + GOOD_WINDOW) / 2)).toBe("good");
    expect(g.state.score).toBe(50);
  });

  it("toque sem tile na janela conta miss e encerra o jogo", () => {
    const g = new Game(beatmap(5.0));
    expect(g.tap(0, 1.0)).toBe("miss");
    expect(g.state.combo).toBe(0);
    expect(g.state.status).toBe("over");
  });

  it("toque na coluna errada não casa com o tile", () => {
    const g = new Game(beatmap(1.0));
    expect(g.tap(1, 1.0)).toBe("miss");
    expect(g.state.status).toBe("over");
  });

  it("não casa o mesmo tile duas vezes", () => {
    const g = new Game({
      tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60 }],
      durationSec: 2,
    });
    expect(g.tap(0, 1.0)).toBe("perfect");
    expect(g.tap(0, 1.0)).toBe("miss");
  });

  it("acumula combo e maxCombo", () => {
    const g = new Game(beatmap(1.0, 2.0));
    g.tap(0, 1.0);
    g.tap(1, 2.0);
    expect(g.state.combo).toBe(2);
    expect(g.state.maxCombo).toBe(2);
    expect(g.state.hitCount).toBe(2);
  });

  it("ignora toques após o fim de jogo", () => {
    const g = new Game(beatmap(5.0));
    g.tap(0, 1.0);
    expect(g.tap(0, 5.0)).toBe("miss");
    expect(g.state.score).toBe(0);
  });
});

describe("Game.update", () => {
  it("encerra o jogo quando um tile passa sem ser tocado", () => {
    const g = new Game(beatmap(1.0));
    g.update(1.0 + GOOD_WINDOW + 0.01);
    expect(g.state.status).toBe("over");
  });

  it("não encerra enquanto o tile ainda está na janela", () => {
    const g = new Game(beatmap(1.0));
    g.update(1.0);
    expect(g.state.status).toBe("playing");
  });

  it("encerra (vitória) quando todos os tiles foram tocados", () => {
    const g = new Game(beatmap(1.0));
    g.tap(0, 1.0);
    g.update(1.0);
    expect(g.state.status).toBe("over");
  });
});
