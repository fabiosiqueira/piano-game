import type { RenderTile } from "./geometry";

const COLOR_BG = "#11121b";
const COLOR_LANE_LINE = "rgba(255,255,255,0.06)";
const COLOR_HIT_LINE = "rgba(255,203,71,0.5)";
const COLOR_TILE = "#3d6cff";
const HIT_LINE_THICKNESS = 4;
const TILE_INSET_RATIO = 0.08;

export interface Frame {
  readonly width: number;
  readonly height: number;
  readonly hitLineY: number;
  readonly laneCount: number;
  readonly tiles: readonly RenderTile[];
}

/** Desenha um quadro do jogo no contexto 2D. Função pura sobre o `ctx`. */
export function drawFrame(ctx: CanvasRenderingContext2D, frame: Frame): void {
  const { width, height, hitLineY, laneCount, tiles } = frame;
  const laneWidth = width / laneCount;

  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = COLOR_LANE_LINE;
  for (let l = 1; l < laneCount; l++) {
    ctx.beginPath();
    ctx.moveTo(l * laneWidth, 0);
    ctx.lineTo(l * laneWidth, height);
    ctx.stroke();
  }

  ctx.fillStyle = COLOR_TILE;
  for (const t of tiles) {
    const x = t.lane * laneWidth + laneWidth * TILE_INSET_RATIO;
    const w = laneWidth * (1 - 2 * TILE_INSET_RATIO);
    ctx.fillRect(x, t.topY, w, t.heightPx);
  }

  ctx.fillStyle = COLOR_HIT_LINE;
  ctx.fillRect(0, hitLineY - HIT_LINE_THICKNESS / 2, width, HIT_LINE_THICKNESS);
}
