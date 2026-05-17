import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameScreen } from "./GameScreen";
import type { Beatmap } from "../engine/types";

const beatmap: Beatmap = {
  tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 0.25 }],
  durationSec: 2,
};

describe("GameScreen", () => {
  it("monta exibindo o countdown inicial", () => {
    render(
      <GameScreen
        beatmap={beatmap}
        fallSec={2.3}
        piano={{ load: vi.fn().mockResolvedValue(undefined), play: vi.fn() }}
        onEnd={vi.fn()}
      />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
