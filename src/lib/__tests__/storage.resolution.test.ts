import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeAll } from "vitest";
import Dexie from "dexie";

vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform: () => "web" } }));
vi.mock("@capacitor-community/sqlite", () => ({ CapacitorSQLite: {}, SQLiteConnection: class {} }));

// Fila legacy NO personalizada con valores arbitrarios que no deben usarse.
const legacyArbitrary = { material: "Acero", thickness: 1.0, bendAllowance90: 9.99, kFactor: 0.11, innerRadius: 7.7, isCustom: false };
// Fila personalizada: sus valores SÍ deben usarse tal cual.
const customRow = { material: "Inox", thickness: 1.0, bendAllowance90: 3.33, kFactor: 0.47, innerRadius: 2.6, isCustom: true };

beforeAll(async () => {
  const db = new Dexie("plegado-db");
  db.version(3).stores({
    pieces: "++id, name, createdAt, material, thickness",
    materials: "++id, [material+thickness], material, thickness",
    templates: "++id, name, createdAt",
  });
  await db.table("materials").bulkAdd([legacyArbitrary, customRow]);
  db.close();
});

describe("resolución de valores de material (Fase 1)", () => {
  it("fila isCustom:false con valores arbitrarios → usa los valores centrales aprobados", async () => {
    const { getMaterialDefaultsWithCalibration } = await import("@/lib/storage");
    const { defaults, calibrated } = await getMaterialDefaultsWithCalibration("Acero", 1.0);
    expect(calibrated).toBe(true);
    // Valores centrales de Acero 1.0 (K=0.38, R=1.5), NO los arbitrarios (0.11 / 7.7).
    expect(defaults).toMatchObject({ kFactor: 0.38, innerRadius: 1.5 });
    expect(defaults!.kFactor).not.toBe(legacyArbitrary.kFactor);
    expect(defaults!.innerRadius).not.toBe(legacyArbitrary.innerRadius);
  });

  it("fila isCustom:true → usa sus K/R/BA90 personalizados tal cual", async () => {
    const { getMaterialDefaultsWithCalibration } = await import("@/lib/storage");
    const { defaults, calibrated } = await getMaterialDefaultsWithCalibration("Inox", 1.0);
    expect(calibrated).toBe(true);
    expect(defaults).toMatchObject({
      kFactor: customRow.kFactor,
      innerRadius: customRow.innerRadius,
      bendAllowance90: customRow.bendAllowance90,
    });
  });

  it("combinación no aprobada sin custom → calibrated:false y defaults undefined (sin fallback inventado)", async () => {
    const { getMaterialDefaultsWithCalibration, getMaterialDefaults } = await import("@/lib/storage");
    // "Titanio" no tiene valores aprobados en el motor central.
    const r1 = await getMaterialDefaultsWithCalibration("Titanio", 1.0);
    expect(r1.calibrated).toBe(false);
    expect(r1.defaults).toBeUndefined();
    // Espesor no aprobado para un material conocido.
    const r2 = await getMaterialDefaultsWithCalibration("Acero", 3.0);
    expect(r2.calibrated).toBe(false);
    expect(r2.defaults).toBeUndefined();
    // getMaterialDefaults también devuelve undefined, nunca un fallback.
    expect(await getMaterialDefaults("Acero", 3.0)).toBeUndefined();
  });

  it("combinación aprobada sin fila custom → calibrated:true con valores centrales", async () => {
    const { getMaterialDefaultsWithCalibration } = await import("@/lib/storage");
    // Inox 0.5 no tiene fila custom; se resuelve con el motor central (K=0.40, R=0.8).
    const { defaults, calibrated } = await getMaterialDefaultsWithCalibration("Inox", 0.5);
    expect(calibrated).toBe(true);
    expect(defaults).toMatchObject({ kFactor: 0.4, innerRadius: 0.8 });
  });
});
