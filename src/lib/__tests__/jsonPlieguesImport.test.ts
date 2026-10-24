import { describe, expect, it } from "vitest";
import { parseJsonPliegues } from "@/lib/jsonPlieguesImport";

describe("parseJsonPliegues", () => {
  it("conserva las coordenadas, incluidos ceros, exportadas por la app", () => {
    const source = [{
      id: "p1", paso: 1, angulo: 90, longitud: 100, colision: false, fuerza: 0,
      x1: 0, y1: 0, x2: 100, y2: 0,
    }];

    expect(parseJsonPliegues(JSON.parse(JSON.stringify(source)))).toEqual(source);
  });

  it("deja sin coordenadas las ausentes o no finitas", () => {
    expect(parseJsonPliegues([{ x1: Number.NaN, y1: 1, x2: 2, y2: Number.POSITIVE_INFINITY }])).toEqual([
      {
        id: "p1", paso: 1, angulo: 90, longitud: 100, colision: false, fuerza: 0,
        tiempo: undefined, x1: undefined, y1: 1, x2: 2, y2: undefined,
      },
    ]);
  });

  it("rechaza un objeto raíz que no sea una lista", () => {
    expect(() => parseJsonPliegues({})).toThrow("El JSON no contiene una lista de pliegues.");
  });
});
