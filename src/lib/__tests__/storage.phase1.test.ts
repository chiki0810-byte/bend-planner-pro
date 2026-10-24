import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeAll } from "vitest";
import Dexie from "dexie";

vi.mock("@capacitor/core", () => ({ Capacitor: { getPlatform: () => "web" } }));
vi.mock("@capacitor-community/sqlite", () => ({ CapacitorSQLite: {}, SQLiteConnection: class {} }));

// Valores "manuales" previos, distintos de los defaults aprobados.
const legacy = { material: "Acero", thickness: 1.0, bendAllowance90: 9.99, kFactor: 0.11, innerRadius: 7.7 };

beforeAll(async () => {
  // Base de datos v2 antigua, sin isCustom.
  const old = new Dexie("plegado-db");
  old.version(2).stores({
    pieces: "++id, name, createdAt, material, thickness",
    materials: "++id, [material+thickness], material, thickness",
    templates: "++id, name, createdAt",
  });
  await old.table("materials").add({ ...legacy });
  old.close();
});

describe("storage Fase 1", () => {
  it("migración: isCustom=false, valores intactos, sin sobrescritura, nuevas filas isCustom=false", async () => {
    const { listMaterials } = await import("@/lib/storage");
    const rows = await listMaterials();
    const acero1 = rows.filter(r => r.material === "Acero" && r.thickness === 1.0);
    expect(acero1).toHaveLength(1);
    expect(acero1[0]).toMatchObject({ ...legacy, isCustom: false });

    // Raw: la migración escribió isCustom=false en el registro antiguo.
    const raw = new Dexie("plegado-db");
    await raw.open();
    const stored = await raw.table("materials").where("[material+thickness]").equals(["Acero", 1.0]).first();
    raw.close();
    expect(stored).toMatchObject({ ...legacy, isCustom: false });

    const nuevo = rows.find(r => r.material === "Inox" && r.thickness === 0.5)!;
    expect(nuevo).toMatchObject({ kFactor: 0.40, innerRadius: 0.8, isCustom: false });
    expect(rows.every(r => r.isCustom === false)).toBe(true);
  });

  it("una fila heredada isCustom=false resuelve valores centrales, no sus valores guardados", async () => {
    const { getMaterialDefaultsWithCalibration } = await import("@/lib/storage");
    const { getMaterialDefaultsByThickness } = await import("@/lib/bendCalc");
    const result = await getMaterialDefaultsWithCalibration("Acero", 1.0);

    expect(result.calibrated).toBe(true);
    expect(result.defaults).toEqual(getMaterialDefaultsByThickness("Acero", 1.0));
    expect(result.defaults).toMatchObject({ kFactor: 0.38, innerRadius: 1.5 });
    expect(result.defaults?.kFactor).not.toBe(legacy.kFactor);
    expect(result.defaults?.innerRadius).not.toBe(legacy.innerRadius);
  });

  it("una fila isCustom=true conserva sus valores manuales", async () => {
    const { upsertMaterial, getMaterialDefaultsWithCalibration } = await import("@/lib/storage");
    const custom = {
      material: "Titanio", thickness: 0.7,
      bendAllowance90: 8.25, kFactor: 0.17, innerRadius: 4.6, isCustom: true,
    };
    await upsertMaterial(custom);

    const result = await getMaterialDefaultsWithCalibration("Titanio", 0.7);
    expect(result).toEqual({ defaults: {
      bendAllowance90: 8.25, kFactor: 0.17, innerRadius: 4.6,
    }, calibrated: true });
  });

  it("rechaza guardar calibraciones inválidas y no entrega filas heredadas inválidas", async () => {
    const { upsertMaterial, getMaterialDefaultsWithCalibration } = await import("@/lib/storage");
    const invalidCalibration = {
      material: "Titanio",
      thickness: 0.7,
      bendAllowance90: 1,
      kFactor: 0.8,
      innerRadius: 1,
      isCustom: true,
    };
    await expect(upsertMaterial(invalidCalibration)).rejects.toThrow(/K debe estar entre/);

    // Simula un registro corrupto o antiguo que ya estuviera guardado antes de validar escrituras.
    const raw = new Dexie("plegado-db");
    await raw.open();
    await raw.table("materials").add({ ...invalidCalibration, material: "Níquel inválido" });
    raw.close();

    await expect(getMaterialDefaultsWithCalibration("Níquel inválido", 0.7)).resolves.toEqual({
      defaults: undefined,
      calibrated: false,
    });
  });

  it("combinación no aprobada sin fila personalizada no devuelve fallback", async () => {
    const { getMaterialDefaultsWithCalibration, getMaterialDefaults } = await import("@/lib/storage");
    const result = await getMaterialDefaultsWithCalibration("Titanio", 0.9);

    expect(result).toEqual({ defaults: undefined, calibrated: false });
    await expect(getMaterialDefaults("Titanio", 0.9)).resolves.toBeUndefined();
  });
  it("ensureBaseMaterials es idempotente y no sobrescribe", async () => {
    const { listMaterials } = await import("@/lib/storage");
    const a = await listMaterials();
    const b = await listMaterials();
    expect(b.length).toBe(a.length);
    expect(b.find(r => r.material === "Acero" && r.thickness === 1.0)).toMatchObject(legacy);
  });

  it("insertMaterialIfMissing no sobrescribe existentes", async () => {
    const { insertMaterialIfMissing, listMaterials } = await import("@/lib/storage");
    await insertMaterialIfMissing({ material: "Acero", thickness: 1.0, bendAllowance90: 1, kFactor: 0.38, innerRadius: 1.5, isCustom: false });
    const rows = await listMaterials();
    expect(rows.find(r => r.material === "Acero" && r.thickness === 1.0)).toMatchObject(legacy);
  });
});
