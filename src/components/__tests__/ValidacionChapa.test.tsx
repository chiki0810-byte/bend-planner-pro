import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ValidacionChapa } from "@/components/ValidacionChapa";
import { sheetStore } from "@/stores/sheetStore";

afterEach(() => {
  cleanup();
  sheetStore.getState().reset();
});

const plieguesConSeparacion = (separacion: number) => [
  {
    id: "p1", paso: 1, angulo: 90, longitud: 10, colision: false, fuerza: 0,
    x1: 0, y1: 0, x2: 10, y2: 10,
  },
  {
    id: "p2", paso: 2, angulo: 90, longitud: 10, colision: false, fuerza: 0,
    x1: 10 + separacion, y1: 10, x2: 20, y2: 10,
  },
];

describe("ValidacionChapa", () => {
  it("acepta extremos que coinciden dentro de la tolerancia de 0.001 mm", () => {
    sheetStore.setState({ plieguesProcesados: plieguesConSeparacion(0.0005) });
    render(<ValidacionChapa />);

    fireEvent.click(screen.getByRole("button", { name: "Validar dibujo" }));

    expect(screen.getByText("✔ Validación correcta. No se encontraron errores.")).toBeTruthy();
  });

  it("mantiene el error para separaciones que superan la tolerancia", () => {
    sheetStore.setState({ plieguesProcesados: plieguesConSeparacion(0.01) });
    render(<ValidacionChapa />);

    fireEvent.click(screen.getByRole("button", { name: "Validar dibujo" }));

    expect(screen.getByText(/Pliegue 1 y 2 no están conectados\./)).toBeTruthy();
  });

  it("rechaza longitudes y ángulos no finitos, y coordenadas parciales", () => {
    sheetStore.setState({
      plieguesProcesados: [
        {
          id: "p1", paso: 1, angulo: Number.NaN, longitud: Number.POSITIVE_INFINITY,
          colision: false, fuerza: 0, x1: 0,
        },
      ],
    });
    render(<ValidacionChapa />);

    fireEvent.click(screen.getByRole("button", { name: "Validar dibujo" }));

    expect(screen.getByText(/longitud inválida/)).toBeTruthy();
    expect(screen.getByText(/coordenadas incompletas o no finitas/)).toBeTruthy();
    expect(screen.getByText(/ángulo fuera de rango/)).toBeTruthy();
  });

  it("sigue permitiendo registros heredados sin coordenadas opcionales", () => {
    sheetStore.setState({
      plieguesProcesados: [
        { id: "p1", paso: 1, angulo: 90, longitud: 10, colision: false, fuerza: 0 },
      ],
    });
    render(<ValidacionChapa />);

    fireEvent.click(screen.getByRole("button", { name: "Validar dibujo" }));

    expect(screen.getByText("✔ Validación correcta. No se encontraron errores.")).toBeTruthy();
  });
});
