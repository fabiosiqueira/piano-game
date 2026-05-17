/** Altura mínima de um bloco, em pixels. */
export const MIN_TILE_PX = 44;
/** Fração da altura onde fica a linha de acerto. */
const HIT_LINE_RATIO = 0.82;

export interface LaneLayout {
  readonly width: number;
  readonly height: number;
  readonly hitLineY: number;
  readonly pixelsPerSecond: number;
}

export interface RenderTile {
  readonly lane: number;
  readonly topY: number;
  readonly heightPx: number;
}

/** Layout do Canvas para uma dada dificuldade (fallSec). */
export function laneLayout(
  width: number,
  height: number,
  fallSec: number,
): LaneLayout {
  const hitLineY = height * HIT_LINE_RATIO;
  return { width, height, hitLineY, pixelsPerSecond: hitLineY / fallSec };
}

/** Posição vertical de um bloco no instante `now`. */
export function tileBox(
  time: number,
  durationSec: number,
  now: number,
  layout: LaneLayout,
): { topY: number; heightPx: number } {
  const heightPx = Math.max(MIN_TILE_PX, durationSec * layout.pixelsPerSecond);
  const bottomY = layout.hitLineY + (now - time) * layout.pixelsPerSecond;
  return { topY: bottomY - heightPx, heightPx };
}

interface TimedTile {
  readonly lane: number;
  readonly time: number;
  readonly durationSec: number;
}

/** Blocos atualmente dentro da tela, prontos para desenhar. */
export function visibleTiles(
  tiles: readonly TimedTile[],
  now: number,
  layout: LaneLayout,
): RenderTile[] {
  const result: RenderTile[] = [];
  for (const t of tiles) {
    const box = tileBox(t.time, t.durationSec, now, layout);
    if (box.topY > layout.height) continue;
    if (box.topY + box.heightPx < 0) continue;
    result.push({ lane: t.lane, topY: box.topY, heightPx: box.heightPx });
  }
  return result;
}
