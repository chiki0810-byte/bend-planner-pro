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

  it("cónico usa K de la calibración cargada", () => {
    const resultado = calcularConico(conico(0.8), () => ({
      bendAllowance90: 1,
      kFactor: 0.2,
      innerRadius: 1,
    }));

    expect(resultado.radio_efectivo).toBeCloseTo(200.16, 6);
  });

  it("canal usa K de la calibración cargada y conserva el radio de utillaje", () => {
    const resultado = calcularCanal(canal(0.8), () => ({
      bendAllowance90: 1,
      kFactor: 0.2,
      innerRadius: 0.9,
    }));
    const baEsperado = (Math.PI / 2) * (1.2 + 0.2 * 0.8);

    expect(resultado.ba_total_mm).toBeCloseTo(baEsperado, 6);
  });

  it("canal rechaza los datos vacíos del pliegue", () => {
    expect(() => calcularCanal({
      ...canal(0.8),
      pliegues: [{ longitud_mm: 0, angulo_deg: 0, radio_mm: 0 }],
    })).toThrow(/datos válidos para cada pliegue/);
  });

  it("canal rechaza ángulos por encima del límite plegable de 160°", () => {
    expect(() => calcularCanal({
      ...canal(0.8),
      pliegues: [{ longitud_mm: 50, angulo_deg: 161, radio_mm: 1.2 }],
    })).toThrow(/datos válidos para cada pliegue/);
  });

  it("cónico rechaza un ángulo de prensa por encima del límite plegable de 160°", () => {
    expect(() => calcularConico({
      ...conico(0.8),
      angulo_pliegue_deg: 161,
    })).toThrow(/no superar 160°/);
  });
});
