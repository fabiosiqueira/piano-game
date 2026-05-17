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

  it("pressLane numa coluna sem bloco perde o jogo", () => {
    const loop = new GameLoop({
      beatmap,
      fallSec: 2.3,
      canvas: fakeCanvas(),
      piano: { load: vi.fn().mockResolvedValue(undefined), play: vi.fn() },
      onEnd: vi.fn(),
    });
    loop.pressLane(3);
    expect(loop.state.status).toBe("lost");
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
