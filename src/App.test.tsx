import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("abre na tela inicial", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Médio" })).toBeInTheDocument();
  });
});
