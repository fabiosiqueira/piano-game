import { describe, it, expect } from "vitest";
import { drawFrame } from "./renderer";

function mockCtx() {
  const calls: Record<string, number> = {};
  const bump = (name: string) => {
    calls[name] = (calls[name] ?? 0) + 1;
  };
  const ctx = {
    calls,
    fillStyle: "",
    strokeStyle: "",
    fillRect: () => bump("fillRect"),
    beginPath: () => bump("beginPath"),
    moveTo: () => bump("moveTo"),
    lineTo: () => bump("lineTo"),
    stroke: () => bump("stroke"),
  };
  return ctx as unknown as CanvasRenderingContext2D & {
    calls: Record<string, number>;
  };
}

describe("drawFrame", () => {
  it("desenha fundo, linha de acerto e um fillRect por bloco", () => {
    const ctx = mockCtx();
    drawFrame(ctx, {
      width: 360,
      height: 640,
      hitLineY: 525,
      laneCount: 4,
      tiles: [
        { lane: 0, topY: 100, heightPx: 60 },
        { lane: 2, topY: 200, heightPx: 90 },
      ],
    });
    // fundo (1) + linha de acerto (1) + 2 blocos = 4
    expect(ctx.calls.fillRect).toBe(4);
    // separadores de coluna = laneCount - 1
    expect(ctx.calls.stroke).toBe(3);
  });
});
