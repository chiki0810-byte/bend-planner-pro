import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { ImportarChapa } from "@/components/ImportarChapa";
import { sheetStore } from "@/stores/sheetStore";

afterEach(() => {
  cleanup();
  sheetStore.getState().reset();
});

describe("ImportarChapa", () => {
  it("reinicia selección y paso tras aplicar una nueva chapa JSON", async () => {
    sheetStore.setState({
      plieguesProcesados: [
        { id: "p2", paso: 2, angulo: 90, longitud: 10, colision: false, fuerza: 0 },
      ],
      pliegueSeleccionado: "p2",
      pasoActual: 2,
    });

    const { container } = render(<ImportarChapa />);
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    const file = new File([""], "pliegues.json", { type: "application/json" });
    Object.defineProperty(file, "text", {
      value: async () => JSON.stringify([
        {
          id: "p1", paso: 1, angulo: 90, longitud: 100,
          colision: false, fuerza: 0, x1: 0, y1: 0, x2: 100, y2: 0,
        },
      ]),
    });

    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });

    await waitFor(() => {
      const state = sheetStore.getState();
      expect(state.plieguesProcesados[0]).toMatchObject({ x1: 0, y1: 0, x2: 100, y2: 0 });
      expect(state.pliegueSeleccionado).toBeNull();
      expect(state.pasoActual).toBe(0);
    });
  });
});
