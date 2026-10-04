import { describe, it, expect, vi, afterEach } from "vitest";
import * as bendCalc from "@/lib/bendCalc";
import { calcularConico, calcularCanal } from "@/lib/plegadoPro";

afterEach(() => vi.restoreAllMocks());

const conico = (t: number) => ({
  diametro_mm: 400, altura_mm: 200, boca_mayor_mm: 400, boca_menor_mm: 300,
  espesor_mm: t, material: "Acero", plegado_en_prensa: true, angulo_pliegue_deg: 90,
});
const canal = (t: number) => ({
  punta_a_mm: 30, punta_b_mm: 50, solape_mm: 20, espesor_mm: t, material: "Acero",
  pliegues: [{ longitud_mm: 100, angulo_deg: 90, radio_mm: 1.8 }],
});

describe("plegadoPro — K central (Fase 1)", () => {
  it("regla central Acero 1.2 → 0.40, 1.5 → 0.42", () => {
    expect(bendCalc.getMaterialDefaultsByThickness("Acero", 1.2)!.kFactor).toBe(0.4);
    expect(bendCalc.getMaterialDefaultsByThickness("Acero", 1.5)!.kFactor).toBe(0.42);
  });

  it.each([[1.2, 0.4], [1.5, 0.42]])("Cónico Acero %s pasa K=%s a calculateBendMath con R geométrico", (t, k) => {
    const spy = vi.spyOn(bendCalc, "calculateBendMath");
    const r = calcularConico(conico(t));
    expect(r).not.toBeNull();
    expect(spy).toHaveBeenCalledWith({ angle: 90, thickness: t, innerRadius: 200, kFactor: k });
  });

  it.each([[1.2, 0.4], [1.5, 0.42]])("Canal Acero %s pasa K=%s a calculateBendMath con R del usuario", (t, k) => {
    const spy = vi.spyOn(bendCalc, "calculateBendMath");
    const r = calcularCanal(canal(t));
    expect(r).not.toBeNull();
    expect(spy).toHaveBeenCalledWith({ angle: 90, thickness: t, innerRadius: 1.8, kFactor: k });
  });

  it("Canal Acero 1.2: desarrollo con K=0.40", () => {
    const r = calcularCanal(canal(1.2))!;
    const ba = (Math.PI / 2) * (1.8 + 0.4 * 1.2);
    expect(r.ba_total_mm).toBeCloseTo(ba, 6);
    expect(r.desarrollo_total_mm).toBeCloseTo(30 + 50 + 100 + ba - 20, 6);
  });

  it("espesor no aprobado 1.05 → null, sin llamar a calculateBendMath", () => {
    const spy = vi.spyOn(bendCalc, "calculateBendMath");
    expect(calcularConico(conico(1.05))).toBeNull();
    expect(calcularCanal(canal(1.05))).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});
