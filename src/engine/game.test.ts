import { describe, it, expect } from "vitest";
import { Game, PERFECT_WINDOW, GOOD_WINDOW } from "./game";
import type { Beatmap } from "./types";

const beatmap = (...times: number[]): Beatmap => ({
  tiles: times.map((time, id) => ({
    id,
    time,
    lane: id % 4,
    midi: 60,
    durationSec: 0.25,
  })),
  durationSec: Math.max(0, ...times) + 1,
});

describe("Game.press", () => {
  it("pressão dentro da janela perfeita conta perfect", () => {
    const g = new Game(beatmap(1.0));
    expect(g.press(0, 1.0 + PERFECT_WINDOW / 2)).toBe("perfect");
    expect(g.state.combo).toBe(1);
    expect(g.state.score).toBe(100);
  });

  it("pressão fora da perfeita mas dentro da boa conta good", () => {
    const g = new Game(beatmap(1.0));
    expect(g.press(0, 1.0 + (PERFECT_WINDOW + GOOD_WINDOW) / 2)).toBe("good");
    expect(g.state.score).toBe(50);
  });

  it("pressão sem bloco na janela conta miss e perde o jogo", () => {
    const g = new Game(beatmap(5.0));
    expect(g.press(0, 1.0)).toBe("miss");
    expect(g.state.combo).toBe(0);
    expect(g.state.status).toBe("lost");
  });

  it("pressão na coluna errada não casa com o bloco", () => {
    const g = new Game(beatmap(1.0));
    expect(g.press(1, 1.0)).toBe("miss");
    expect(g.state.status).toBe("lost");
  });

  it("não casa o mesmo bloco duas vezes", () => {
    const g = new Game({
      tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 0.25 }],
      durationSec: 2,
    });
    expect(g.press(0, 1.0)).toBe("perfect");
    expect(g.press(0, 1.0)).toBe("miss");
  });

  it("acumula combo e maxCombo", () => {
    const g = new Game(beatmap(1.0, 2.0));
    g.press(0, 1.0);
    g.press(1, 2.0);
    expect(g.state.combo).toBe(2);
    expect(g.state.maxCombo).toBe(2);
    expect(g.state.hitCount).toBe(2);
  });

  it("ignora pressões após o fim de jogo", () => {
    const g = new Game(beatmap(5.0));
    g.press(0, 1.0);
    expect(g.press(0, 5.0)).toBe("miss");
    expect(g.state.score).toBe(0);
  });
});

describe("Game.peekTarget", () => {
  it("retorna o bloco não-tocado mais próximo da coluna", () => {
    const g = new Game(beatmap(1.0, 2.0));
    expect(g.peekTarget(0, 1.1)?.id).toBe(0);
  });

  it("retorna undefined quando a coluna não tem blocos", () => {
    const g = new Game(beatmap(1.0));
    expect(g.peekTarget(3, 1.0)).toBeUndefined();
  });
});

describe("Game.release", () => {
  it("bônus ao segurar a nota longa até o fim", () => {
    const g = new Game({
      tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 1.0 }],
      durationSec: 3,
    });
    g.press(0, 1.0);
    const afterPress = g.state.score;
    g.release(0, 2.0);
    expect(g.state.score).toBeGreaterThan(afterPress);
  });

  it("soltar cedo não dá bônus e não perde o jogo", () => {
    const g = new Game({
      tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 1.0 }],
      durationSec: 3,
    });
    g.press(0, 1.0);
    const afterPress = g.state.score;
    g.release(0, 1.1);
    expect(g.state.score).toBe(afterPress);
    expect(g.state.status).toBe("playing");
  });

  it("release sem pressão prévia é inofensivo", () => {
    const g = new Game(beatmap(1.0));
    expect(() => g.release(0, 1.0)).not.toThrow();
  });
});

describe("Game.update", () => {
  it("perde o jogo quando um bloco passa sem ser tocado", () => {
    const g = new Game(beatmap(1.0));
    g.update(1.0 + GOOD_WINDOW + 0.01);
    expect(g.state.status).toBe("lost");
  });

  it("não encerra enquanto o bloco ainda está na janela", () => {
    const g = new Game(beatmap(1.0));
    g.update(1.0);
    expect(g.state.status).toBe("playing");
  });

  it("vence quando todos os blocos foram tocados", () => {
    const g = new Game(beatmap(1.0));
    g.press(0, 1.0);
    g.update(1.0);
    expect(g.state.status).toBe("won");
  });
});
