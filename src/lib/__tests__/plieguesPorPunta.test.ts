import { describe, expect, it } from "vitest";
import { calcularDesarrolloPunta } from "@/lib/plieguesPorPunta";

describe("calcularDesarrolloPunta", () => {
  it("no presenta desarrollo si falta una punta o no hay pliegues", () => {
    expect(calcularDesarrolloPunta([], [])).toBeUndefined();
    expect(calcularDesarrolloPunta([50], [])).toBeUndefined();
  });

  it("calcula el desarrollo cuando longitudes y ganancias están completas", () => {
    expect(calcularDesarrolloPunta([50, 40], [2.5, 2])).toBe(85.5);
  });

  it("rechaza tramos no positivos, valores no finitos y desarrollo no positivo", () => {
    expect(calcularDesarrolloPunta([0], [1])).toBeUndefined();
    expect(calcularDesarrolloPunta([10], [Number.NaN])).toBeUndefined();
    expect(calcularDesarrolloPunta([2], [2])).toBeUndefined();
    expect(calcularDesarrolloPunta([1], [2])).toBeUndefined();
  });
});
