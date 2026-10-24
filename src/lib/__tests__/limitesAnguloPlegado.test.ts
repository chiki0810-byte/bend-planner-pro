import { describe, expect, it } from "vitest";
import {
  ANGULO_CRITICO_PLEGADO,
  ANGULO_MAXIMO_PLEGABLE,
  esAnguloCritico,
  esAnguloPlegable,
} from "@/lib/limitesAnguloPlegado";

describe("límites industriales de ángulo de plegado", () => {
  it("acepta hasta el límite plegable de 160° y rechaza valores superiores", () => {
    expect(esAnguloPlegable(ANGULO_MAXIMO_PLEGABLE)).toBe(true);
    expect(esAnguloPlegable(ANGULO_MAXIMO_PLEGABLE + 0.1)).toBe(false);
  });

  it("solo marca como críticos los ángulos mayores de 130°", () => {
    expect(esAnguloCritico(ANGULO_CRITICO_PLEGADO)).toBe(false);
    expect(esAnguloCritico(ANGULO_CRITICO_PLEGADO + 0.1)).toBe(true);
  });

  it("rechaza ángulos nulos y no finitos", () => {
    expect(esAnguloPlegable(0)).toBe(false);
    expect(esAnguloPlegable(Number.NaN)).toBe(false);
    expect(esAnguloPlegable(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
