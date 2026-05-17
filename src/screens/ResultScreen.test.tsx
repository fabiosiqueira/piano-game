import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultScreen } from "./ResultScreen";

const baseProps = {
  score: 1200,
  maxCombo: 8,
  hitCount: 9,
  totalTiles: 10,
  onReplay: () => {},
  onBack: () => {},
};

describe("ResultScreen", () => {
  it("mostra a mensagem de vitória", () => {
    render(<ResultScreen status="won" {...baseProps} />);
    expect(screen.getByText(/venceu/i)).toBeInTheDocument();
  });

  it("mostra a mensagem de game over", () => {
    render(<ResultScreen status="lost" {...baseProps} />);
    expect(screen.getByText(/game over/i)).toBeInTheDocument();
  });

  it("exibe pontos e combo máximo", () => {
    render(<ResultScreen status="won" {...baseProps} />);
    expect(screen.getByText("1200")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("chama onReplay ao clicar em jogar de novo", async () => {
    const onReplay = vi.fn();
    render(<ResultScreen status="won" {...baseProps} onReplay={onReplay} />);
    await userEvent.click(
      screen.getByRole("button", { name: /jogar de novo/i }),
    );
    expect(onReplay).toHaveBeenCalledOnce();
  });
});
