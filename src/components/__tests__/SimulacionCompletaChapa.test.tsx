import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SimulacionCompletaChapa } from "@/components/SimulacionCompletaChapa";
import { sheetStore } from "@/stores/sheetStore";

afterEach(() => {
  cleanup();
  sheetStore.getState().reset();
});

describe("SimulacionCompletaChapa", () => {
  it("renderiza los controles sin acceder a un pliegue antes de inicializarlo", () => {
    expect(() => render(<SimulacionCompletaChapa />)).not.toThrow();
    expect(screen.getByRole("button", { name: "Simular toda la chapa" })).toBeTruthy();
  });
});
