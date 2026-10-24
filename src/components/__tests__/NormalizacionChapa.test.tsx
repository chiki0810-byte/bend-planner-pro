import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NormalizacionChapa } from "@/components/NormalizacionChapa";
import { sheetStore } from "@/stores/sheetStore";

afterEach(() => {
  cleanup();
  sheetStore.getState().reset();
});

describe("NormalizacionChapa", () => {
  it("preserva orden y longitudes si faltan coordenadas, sin inventar geometría", () => {
    sheetStore.setState({
      plieguesProcesados: [
        { id: "legacy", paso: 7, angulo: 90, longitud: 25, colision: false, fuerza: 0 },
        {
          id: "geometria", paso: 8, angulo: 90, longitud: 40,
          colision: false, fuerza: 0, x1: 10, y1: 0, x2: 10, y2: 30,
        },
      ],
    });

    render(<NormalizacionChapa />);
    fireEvent.click(screen.getByRole("button", { name: "Normalizar dibujo" }));

    const pliegues = sheetStore.getState().plieguesProcesados;
    expect(pliegues.map(({ id }) => id)).toEqual(["legacy", "geometria"]);
    expect(pliegues.map(({ paso }) => paso)).toEqual([1, 2]);
    expect(pliegues[0].longitud).toBe(25);
    expect("x1" in pliegues[0]).toBe(false);
    expect(pliegues[1].longitud).toBe(30);
  });

  it("mantiene ordenamiento y recálculo cuando toda la geometría está completa", () => {
    sheetStore.setState({
      plieguesProcesados: [
        {
          id: "derecha", paso: 1, angulo: 90, longitud: 99,
          colision: false, fuerza: 0, x1: 20, y1: 0, x2: 20, y2: 10,
        },
        {
          id: "izquierda", paso: 2, angulo: 90, longitud: 99,
          colision: false, fuerza: 0, x1: 0, y1: 0, x2: 0, y2: 5,
        },
      ],
      pliegueSeleccionado: "derecha",
      pasoActual: 1,
    });

    render(<NormalizacionChapa />);
    fireEvent.click(screen.getByRole("button", { name: "Normalizar dibujo" }));

    const pliegues = sheetStore.getState().plieguesProcesados;
    expect(pliegues.map(({ id }) => id)).toEqual(["izquierda", "derecha"]);
    expect(pliegues.map(({ longitud }) => longitud)).toEqual([5, 10]);
    expect(sheetStore.getState().pliegueSeleccionado).toBe("derecha");
    expect(sheetStore.getState().pasoActual).toBe(2);
  });
});
