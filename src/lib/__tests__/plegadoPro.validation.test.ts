import { describe, expect, it } from "vitest";
import { calcularCanal, calcularConico } from "@/lib/plegadoPro";

const conico = (espesor_mm: number) => ({
  diametro_mm: 400,
  altura_mm: 200,
  boca_mayor_mm: 400,
  boca_menor_mm: 300,
  espesor_mm,
  material: "Acero",
  plegado_en_prensa: true,
  angulo_pliegue_deg: 90,
});

const canal = (espesor_mm: number) => ({
  punta_a_mm: 30,
  punta_b_mm: 50,
  solape_mm: 12,
  espesor_mm,
  material: "Acero",
  pliegues: [{ longitud_mm: 50, angulo_deg: 90, radio_mm: 1.2 }],
});

describe("validación del plegado Pro por espesor", () => {
  it("cónico rechaza Acero de 0,7 mm sin valores aprobados", () => {
    expect(() => calcularConico(conico(0.7)))
      .toThrow(/No hay valores K\/R aprobados/);
  });

  it("canal rechaza Acero de 0,7 mm sin valores aprobados", () => {
    expect(() => calcularCanal(canal(0.7)))
      .toThrow(/No hay valores K\/R aprobados/);
  });

  it("cónico usa K=0,35 para Acero de 0,8 mm", () => {
    const resultado = calcularConico(conico(0.8));
    const baEsperado = (Math.PI / 2) * (200 + 0.35 * 0.8);

    expect(resultado.ba_correccion_mm).toBeCloseTo(baEsperado, 6);
  });

  it("canal usa K=0,35 para Acero de 0,8 mm", () => {
    const resultado = calcularCanal(canal(0.8));
    const baEsperado = (Math.PI / 2) * (1.2 + 0.35 * 0.8);

    expect(resultado.ba_total_mm).toBeCloseTo(baEsperado, 6);
  });
});