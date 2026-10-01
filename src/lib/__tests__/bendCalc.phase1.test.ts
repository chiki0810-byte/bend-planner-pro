import { describe, it, expect } from "vitest";
import {
  getMaterialDefaultsByThickness, calculateBendMath, computeBend, computeDevelopment,
} from "@/lib/bendCalc";

const STEEL = ["Acero", "Galvanizado", "Corten", "Duro 500", "Duro 600"];
const STEEL_K: Record<number, number> = { 0.5: 0.33, 0.6: 0.33, 0.8: 0.35, 1.0: 0.38, 1.2: 0.40, 1.5: 0.42 };
const OTHER_K: Record<string, number> = { Inox: 0.40, Aluminio: 0.50, "Latón": 0.45, Cobre: 0.45 };
const R: Record<number, number> = { 0.5: 0.8, 0.6: 1.0, 0.8: 1.2, 1.0: 1.5, 1.2: 1.8, 1.5: 2.2 };
const TS = [0.5, 0.6, 0.8, 1.0, 1.2, 1.5];

describe("getMaterialDefaultsByThickness", () => {
  it("familia acero: K y R aprobados", () => {
    for (const m of STEEL) for (const t of TS) {
      const d = getMaterialDefaultsByThickness(m, t)!;
      expect(d.kFactor).toBe(STEEL_K[t]);
      expect(d.innerRadius).toBe(R[t]);
    }
  });
  it("otros materiales: K fijo y R por espesor", () => {
    for (const m of Object.keys(OTHER_K)) for (const t of TS) {
      const d = getMaterialDefaultsByThickness(m, t)!;
      expect(d.kFactor).toBe(OTHER_K[m]);
      expect(d.innerRadius).toBe(R[t]);
    }
  });
  it("no aprobados → undefined", () => {
    expect(getMaterialDefaultsByThickness("Bronce", 1.0)).toBeUndefined();
    expect(getMaterialDefaultsByThickness("Acero", 2.0)).toBeUndefined();
    expect(getMaterialDefaultsByThickness("Galvanizado", 2.0)).toBeUndefined();
    expect(getMaterialDefaultsByThickness("Inox", 0.7)).toBeUndefined();
    expect(getMaterialDefaultsByThickness("Acero", 1.05)).toBeUndefined();
  });
  it("BA90 derivado de calculateBendMath a 90°", () => {
    for (const m of [...STEEL, ...Object.keys(OTHER_K)]) for (const t of TS) {
      const d = getMaterialDefaultsByThickness(m, t)!;
      const ba = calculateBendMath({ angle: 90, thickness: t, innerRadius: d.innerRadius, kFactor: d.kFactor }).bendAllowance;
      expect(d.bendAllowance90).toBe(Math.round(ba * 100) / 100);
    }
  });
});

describe("regresión matemática", () => {
  it("calculateBendMath 90° t=1 R=1.5 K=0.38", () => {
    const r = calculateBendMath({ angle: 90, thickness: 1, innerRadius: 1.5, kFactor: 0.38 });
    expect(r.bendAllowance).toBeCloseTo(2.953097, 5);
    expect(r.outsideSetback).toBeCloseTo(2.5, 6);
    expect(r.bendDeduction).toBeCloseTo(2.046903, 5);
  });
  it("calculateBendMath 135° t=1.5 R=2.2 K=0.42", () => {
    const r = calculateBendMath({ angle: 135, thickness: 1.5, innerRadius: 2.2, kFactor: 0.42 });
    expect(r.bendAllowance).toBeCloseTo((3 * Math.PI / 4) * 2.83, 6);
    expect(r.outsideSetback).toBeCloseTo(Math.tan(67.5 * Math.PI / 180) * 3.7, 6);
    expect(r.bendDeduction).toBeCloseTo(2 * Math.tan(67.5 * Math.PI / 180) * 3.7 - (3 * Math.PI / 4) * 2.83, 6);
  });
  it("computeBend redondea y aplica defaults", () => {
    const b = computeBend({ angle: 90, distance: 50 }, 1, { bendAllowance90: 1.6, kFactor: 0.38, innerRadius: 1.5 }, 1);
    expect(b.bendAllowance).toBe(2.95);
    expect(b.outsideSetback).toBe(2.5);
    expect(b.bendDeduction).toBe(2.05);
    expect(b.direction).toBe(1);
    expect(b.directionLabel).toBe("up");
    expect(b.tolerance).toBe(0.1);
    expect(b.dimensionReference).toBeNull();
  });
  it("computeDevelopment = longitud + ΣBA, corrección 0", () => {
    const d0 = { bendAllowance90: 1.6, kFactor: 0.38, innerRadius: 1.5 };
    const bends = [computeBend({ angle: 90, distance: 50 }, 1, d0, 1), computeBend({ angle: 90, distance: 50 }, 1, d0, 2)];
    const r = computeDevelopment(100, bends);
    expect(r.totalBendAllowance).toBe(5.9);
    expect(r.theoreticalDevelopedLength).toBe(105.9);
    expect(r.workshopCorrection).toBe(0);
    expect(r.finalCutLength).toBe(105.9);
  });
});
