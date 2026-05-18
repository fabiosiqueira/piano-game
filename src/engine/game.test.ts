import { describe, it, expect } from "vitest";
import { Game, PERFECT_WINDOW, GOOD_WINDOW } from "./game";
import type { Beatmap } from "./types";

/** Tempo de queda usado nos testes (s). */
const FALL_SEC = 2.3;

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

const game = (...times: number[]): Game =>
  new Game(beatmap(...times), FALL_SEC);

describe("Game.press", () => {
  it("pressão dentro da janela perfeita conta perfect", () => {
    const g = game(1.0);
    expect(g.press(0, 1.0 + PERFECT_WINDOW / 2)).toBe("perfect");
    expect(g.state.combo).toBe(1);
    expect(g.state.score).toBe(100);
  });

  it("pressão fora da perfeita mas dentro da boa conta good", () => {
    const g = game(1.0);
    expect(g.press(0, 1.0 + (PERFECT_WINDOW + GOOD_WINDOW) / 2)).toBe("good");
    expect(g.state.score).toBe(50);
  });

  it("pressão antecipada com o bloco já visível conta good e não perde", () => {
    const g = game(2.0);
    // Bloco entra na tela em time - fallSec = -0.3s; pressão em 0.5s é cedo
    // mas dentro da queda visível.
    expect(g.press(0, 0.5)).toBe("good");
    expect(g.state.combo).toBe(1);
    expect(g.state.status).toBe("playing");
  });

  it("pressão antes do bloco entrar na tela é ignorada, sem encerrar o jogo", () => {
    const g = game(5.0);
    expect(g.press(0, 1.0)).toBe("miss");
    expect(g.state.status).toBe("playing");
  });

  it("pressar várias vezes antecipadamente não encerra o jogo", () => {
    const g = game(2.0);
    g.press(0, 0.5);
    g.press(0, 0.5);
    g.press(0, 0.5);
    expect(g.state.status).toBe("playing");
  });

  it("pressão tardia, com o bloco já passado da linha, é ignorada", () => {
    const g = game(1.0);
    expect(g.press(0, 1.0 + GOOD_WINDOW + 0.05)).toBe("miss");
    expect(g.state.status).toBe("playing");
  });

  it("pressão numa coluna sem bloco é ignorada, sem encerrar o jogo", () => {
    const g = game(1.0);
    expect(g.press(1, 1.0)).toBe("miss");
    expect(g.state.status).toBe("playing");
  });

  it("não casa o mesmo bloco duas vezes", () => {
    const g = new Game(
      {
        tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 0.25 }],
        durationSec: 2,
      },
      FALL_SEC,
    );
    expect(g.press(0, 1.0)).toBe("perfect");
    expect(g.press(0, 1.0)).toBe("miss");
  });

  it("acumula combo e maxCombo", () => {
    const g = game(1.0, 2.0);
    g.press(0, 1.0);
    g.press(1, 2.0);
    expect(g.state.combo).toBe(2);
    expect(g.state.maxCombo).toBe(2);
    expect(g.state.hitCount).toBe(2);
  });

  it("ignora pressões após o fim de jogo", () => {
    const g = game(1.0, 1.1, 1.2, 5.0);
    g.update(1.2 + GOOD_WINDOW + 0.1); // 3 blocos passaram → lost
    expect(g.state.status).toBe("lost");
    expect(g.press(0, 5.0)).toBe("miss");
    expect(g.state.score).toBe(0);
  });
});

describe("Game.peekTarget", () => {
  it("retorna o bloco não-tocado mais próximo da coluna", () => {
    const g = game(1.0, 2.0);
    expect(g.peekTarget(0, 1.1)?.id).toBe(0);
  });

  it("retorna undefined quando a coluna não tem blocos", () => {
    const g = game(1.0);
    expect(g.peekTarget(3, 1.0)).toBeUndefined();
  });
});

describe("Game.release", () => {
  it("bônus ao segurar a nota longa até o fim", () => {
    const g = new Game(
      {
        tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 1.0 }],
        durationSec: 3,
      },
      FALL_SEC,
    );
    g.press(0, 1.0);
    const afterPress = g.state.score;
    g.release(0, 2.0);
    expect(g.state.score).toBeGreaterThan(afterPress);
  });

  it("soltar cedo não dá bônus e não perde o jogo", () => {
    const g = new Game(
      {
        tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 1.0 }],
        durationSec: 3,
      },
      FALL_SEC,
    );
    g.press(0, 1.0);
    const afterPress = g.state.score;
    g.release(0, 1.1);
    expect(g.state.score).toBe(afterPress);
    expect(g.state.status).toBe("playing");
  });

  it("release sem pressão prévia é inofensivo", () => {
    const g = game(1.0);
    expect(() => g.release(0, 1.0)).not.toThrow();
  });
});

describe("Game.update", () => {
  it("conta o bloco perdido sem encerrar o jogo abaixo do limite", () => {
    const g = game(1.0, 2.0, 3.0);
    g.update(1.0 + GOOD_WINDOW + 0.01);
    expect(g.state.misses).toBe(1);
    expect(g.state.status).toBe("playing");
  });

  it("não conta o mesmo bloco perdido duas vezes", () => {
    const g = game(1.0, 2.0, 3.0);
    g.update(1.0 + GOOD_WINDOW + 0.01);
    g.update(1.0 + GOOD_WINDOW + 0.5);
    expect(g.state.misses).toBe(1);
  });

  it("perde o jogo ao deixar 3 blocos passarem", () => {
    const g = game(1.0, 1.1, 1.2);
    g.update(1.2 + GOOD_WINDOW + 0.01);
    expect(g.state.misses).toBe(3);
    expect(g.state.status).toBe("lost");
  });

  it("bloco perdido zera o combo", () => {
    const g = game(1.0, 2.0, 3.0);
    g.press(0, 1.0);
    expect(g.state.combo).toBe(1);
    g.update(2.0 + GOOD_WINDOW + 0.01);
    expect(g.state.combo).toBe(0);
  });

  it("não encerra enquanto o bloco ainda está na janela", () => {
    const g = game(1.0);
    g.update(1.0);
    expect(g.state.status).toBe("playing");
  });

  it("vence quando todos os blocos foram tocados", () => {
    const g = game(1.0);
    g.press(0, 1.0);
    g.update(1.0);
    expect(g.state.status).toBe("won");
  });

  it("vence ao fim da música mesmo com 1 ou 2 blocos perdidos", () => {
    const g = game(1.0, 2.0);
    g.press(0, 1.0);
    g.update(2.0 + GOOD_WINDOW + 0.01); // perde o 2º bloco (1 miss)
    expect(g.state.status).toBe("won");
  });
});

describe("Game.isHit", () => {
  it("marca o bloco tocado para sumir da tela", () => {
    const g = game(1.0);
    expect(g.isHit(0)).toBe(false);
    g.press(0, 1.0);
    expect(g.isHit(0)).toBe(true);
  });
});
