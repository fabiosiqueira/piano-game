import { describe, it, expect, vi } from "vitest";
import { GameLoop } from "./gameLoop";
import type { Beatmap } from "../engine/types";

function fakeCanvas(): HTMLCanvasElement {
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  };
  return {
    width: 360,
    height: 640,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
}

const beatmap: Beatmap = {
  tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 0.25 }],
  durationSec: 2,
};

describe("GameLoop", () => {
  it("pressLane toca a nota da coluna alvo", () => {
    const play = vi.fn();
    const loop = new GameLoop({
      beatmap,
      fallSec: 2.3,
      canvas: fakeCanvas(),
      piano: { load: vi.fn().mockResolvedValue(undefined), play },
      onEnd: vi.fn(),
    });
    loop.pressLane(0);
    expect(play).toHaveBeenCalledWith(60);
  });

  it("pressLane numa coluna sem bloco é ignorada, sem encerrar o jogo", () => {
    const loop = new GameLoop({
      beatmap,
      fallSec: 2.3,
      canvas: fakeCanvas(),
      piano: { load: vi.fn().mockResolvedValue(undefined), play: vi.fn() },
      onEnd: vi.fn(),
    });
    loop.pressLane(3);
    expect(loop.state.status).toBe("playing");
  });

  it("não desenha blocos já tocados", () => {
    const fillRect = vi.fn();
    const ctx = {
      fillStyle: "",
      strokeStyle: "",
      fillRect,
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    };
    const canvas = {
      width: 360,
      height: 640,
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;
    const loop = new GameLoop({
      beatmap: {
        tiles: [{ id: 0, time: 0, lane: 0, midi: 60, durationSec: 0.25 }],
        durationSec: 1,
      },
      fallSec: 2.3,
      canvas,
      piano: { load: vi.fn().mockResolvedValue(undefined), play: vi.fn() },
      onEnd: vi.fn(),
    });
    loop.pressLane(0); // toca o único bloco
    fillRect.mockClear();
    loop.start(); // roda um frame
    loop.stop();
    // só fundo + linha de acerto desenhados; o bloco tocado não aparece
    expect(fillRect).toHaveBeenCalledTimes(2);
  });

  it("dá lead-in: bloco em time≈0 não é perdido logo no início", () => {
    const onEnd = vi.fn();
    const nowMock = vi.spyOn(performance, "now");
    // startedAt = 0; primeiro frame consulta o relógio em t = 0,3s reais.
    nowMock.mockReturnValueOnce(0).mockReturnValue(300);
    const loop = new GameLoop({
      beatmap: {
        tiles: [{ id: 0, time: 0, lane: 0, midi: 60, durationSec: 0.25 }],
        durationSec: 1,
      },
      fallSec: 2,
      canvas: fakeCanvas(),
      piano: { load: vi.fn().mockResolvedValue(undefined), play: vi.fn() },
      onEnd,
    });
    loop.start();
    loop.stop();
    nowMock.mockRestore();
    expect(loop.state.status).toBe("playing");
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("lança erro se o contexto 2D não estiver disponível", () => {
    const canvas = {
      width: 360,
      height: 640,
      getContext: () => null,
    } as unknown as HTMLCanvasElement;
    expect(
      () =>
        new GameLoop({
          beatmap,
          fallSec: 2.3,
          canvas,
          piano: { load: vi.fn().mockResolvedValue(undefined), play: vi.fn() },
          onEnd: vi.fn(),
        }),
    ).toThrow();
  });
});
