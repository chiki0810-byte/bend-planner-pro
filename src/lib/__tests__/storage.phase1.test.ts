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
