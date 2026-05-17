import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartScreen } from "./StartScreen";

describe("StartScreen", () => {
  it("mostra os três botões de dificuldade", () => {
    render(<StartScreen onStart={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Lento" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Médio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rápido" })).toBeInTheDocument();
  });

  it("chama onStart com a dificuldade escolhida", async () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} />);
    await userEvent.click(screen.getByRole("button", { name: "Rápido" }));
    expect(onStart).toHaveBeenCalledWith("rapido");
  });
});
