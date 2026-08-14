import Dexie, { Table } from 'dexie';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { DEFAULT_THICKNESS_TABLE, DefaultsByThickness } from './bendCalc';

export interface SavedPiece {
  id?: number;
  name: string;
  createdAt: number;
  thickness: number;
  material: string;
  pieceLength: number;
  payload: string;
}

export interface MaterialRow {
  id?: number;
  material: string;
  thickness: number;
  bendAllowance90: number;
  kFactor: number;
  innerRadius: number;
}

export interface Template {
  id?: number;
  name: string;
  createdAt: number;
  payload: string; // JSON con CalculatorState
}

class WebDB extends Dexie {
  pieces!: Table<SavedPiece, number>;
  materials!: Table<MaterialRow, number>;
  templates!: Table<Template, number>;
  constructor() {
    super('plegado-db');
    this.version(2).stores({
      pieces: '++id, name, createdAt, material, thickness',
      materials: '++id, [material+thickness], material, thickness',
      templates: '++id, name, createdAt',
    });
  }
}
const webDb = new WebDB();

let sqliteConn: SQLiteDBConnection | null = null;
const sqlite = new SQLiteConnection(CapacitorSQLite);
const isNative = () => {
  const p = Capacitor.getPlatform();
  return p === 'android' || p === 'ios' || p === 'electron';
};

async function getNativeDb(): Promise<SQLiteDBConnection> {
  if (sqliteConn) return sqliteConn;
  const dbName = 'plegado';
  const ret = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(dbName, false)).result;
  if (ret.result && isConn) {
    sqliteConn = await sqlite.retrieveConnection(dbName, false);
  } else {
    sqliteConn = await sqlite.createConnection(dbName, false, 'no-encryption', 1, false);
  }
  await sqliteConn.open();
  await sqliteConn.execute(`
    CREATE TABLE IF NOT EXISTS pieces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, createdAt INTEGER NOT NULL,
      thickness REAL NOT NULL, material TEXT NOT NULL,
      pieceLength REAL NOT NULL, payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material TEXT NOT NULL, thickness REAL NOT NULL,
      bendAllowance90 REAL NOT NULL, kFactor REAL NOT NULL, innerRadius REAL NOT NULL,
      UNIQUE(material, thickness)
    );
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, createdAt INTEGER NOT NULL, payload TEXT NOT NULL
    );
  `);
  return sqliteConn;
}

// ----- Pieces -----
export async function savePiece(p: Omit<SavedPiece, 'id' | 'createdAt'>): Promise<number> {
  const row: SavedPiece = { ...p, createdAt: Date.now() };
  if (isNative()) {
    const db = await getNativeDb();
    const res = await db.run(
      `INSERT INTO pieces (name, createdAt, thickness, material, pieceLength, payload) VALUES (?, ?, ?, ?, ?, ?);`,
      [row.name, row.createdAt, row.thickness, row.material, row.pieceLength, row.payload],
    );
    return res.changes?.lastId ?? 0;
  }
  return await webDb.pieces.add(row);
}
export async function listPieces(): Promise<SavedPiece[]> {
  if (isNative()) {
    const db = await getNativeDb();
    const res = await db.query(`SELECT * FROM pieces ORDER BY createdAt DESC;`);
    return (res.values ?? []) as SavedPiece[];
  }
  return await webDb.pieces.orderBy('createdAt').reverse().toArray();
}
export async function deletePiece(id: number): Promise<void> {
  if (isNative()) {
    const db = await getNativeDb();
    await db.run(`DELETE FROM pieces WHERE id = ?;`, [id]);
    return;
  }
  await webDb.pieces.delete(id);
}

// ----- Materials -----
/** Catálogo genérico de materiales (base de la app, no específico de un taller). */
export const BASE_MATERIALS = [
  'Acero',
  'Inox',
  'Aluminio',
  'Galvanizado',
  'Corten',
  'Duro 500',
  'Duro 600',
  'Latón',
  'Cobre',
];

async function fetchMaterials(): Promise<MaterialRow[]> {
  if (isNative()) {
    const db = await getNativeDb();
    const res = await db.query(`SELECT * FROM materials ORDER BY material, thickness;`);
    return (res.values ?? []) as MaterialRow[];
  }
  return await webDb.materials.toArray();
}

export async function listMaterials(): Promise<MaterialRow[]> {
  const rows = await fetchMaterials();
  const added = await ensureBaseMaterials(rows);
  return added ? await fetchMaterials() : rows;
}

/** Inserta únicamente las combinaciones material+espesor que faltan.
 *  Idempotente: nunca duplica ni sobrescribe valores existentes. */
async function ensureBaseMaterials(existing: MaterialRow[]): Promise<boolean> {
  const key = (m: string, t: number) => `${m}|${t.toFixed(2)}`;
  const present = new Set(existing.map(r => key(r.material, r.thickness)));
  let inserted = false;
  for (const mat of BASE_MATERIALS) {
    for (const [tStr, def] of Object.entries(DEFAULT_THICKNESS_TABLE)) {
      const t = parseFloat(tStr);
      if (present.has(key(mat, t))) continue;
      await upsertMaterial({
        material: mat, thickness: t,
        bendAllowance90: def.bendAllowance90,
        kFactor: def.kFactor, innerRadius: def.innerRadius,
      });
      inserted = true;
    }
  }
  return inserted;
}

export async function upsertMaterial(m: Omit<MaterialRow, 'id'>): Promise<void> {
  if (isNative()) {
    const db = await getNativeDb();
    await db.run(
      `INSERT INTO materials (material, thickness, bendAllowance90, kFactor, innerRadius)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(material, thickness) DO UPDATE SET
         bendAllowance90 = excluded.bendAllowance90,
         kFactor = excluded.kFactor,
         innerRadius = excluded.innerRadius;`,
      [m.material, m.thickness, m.bendAllowance90, m.kFactor, m.innerRadius],
    );
    return;
  }
  const existing = await webDb.materials
    .where('[material+thickness]').equals([m.material, m.thickness]).first();
  if (existing) await webDb.materials.update(existing.id!, m);
  else await webDb.materials.add(m);
}

export async function deleteMaterial(id: number): Promise<void> {
  if (isNative()) {
    const db = await getNativeDb();
    await db.run(`DELETE FROM materials WHERE id = ?;`, [id]);
    return;
  }
  await webDb.materials.delete(id);
}

export async function getMaterialDefaults(material: string, thickness: number): Promise<DefaultsByThickness> {
  const { defaults } = await getMaterialDefaultsWithCalibration(material, thickness);
  return defaults;
}

export async function getMaterialDefaultsWithCalibration(
  material: string,
  thickness: number,
): Promise<{ defaults: DefaultsByThickness; calibrated: boolean }> {
  const all = await listMaterials();
  const found = all.find(m => m.material === material && Math.abs(m.thickness - thickness) < 1e-6);
  if (found) {
    return {
      defaults: { bendAllowance90: found.bendAllowance90, kFactor: found.kFactor, innerRadius: found.innerRadius },
      calibrated: true,
    };
  }
  return {
    defaults: DEFAULT_THICKNESS_TABLE[thickness] ?? { bendAllowance90: 1.5, kFactor: 0.38, innerRadius: thickness * 1.5 },
    calibrated: false,
  };
}

// ----- Templates -----
export async function saveTemplate(t: Omit<Template, 'id' | 'createdAt'>): Promise<number> {
  const row: Template = { ...t, createdAt: Date.now() };
  if (isNative()) {
    const db = await getNativeDb();
    const res = await db.run(
      `INSERT INTO templates (name, createdAt, payload) VALUES (?, ?, ?);`,
      [row.name, row.createdAt, row.payload],
    );
    return res.changes?.lastId ?? 0;
  }
  return await webDb.templates.add(row);
}
export async function listTemplates(): Promise<Template[]> {
  if (isNative()) {
    const db = await getNativeDb();
    const res = await db.query(`SELECT * FROM templates ORDER BY createdAt DESC;`);
    return (res.values ?? []) as Template[];
  }
  return await webDb.templates.orderBy('createdAt').reverse().toArray();
}
export async function deleteTemplate(id: number): Promise<void> {
  if (isNative()) {
    const db = await getNativeDb();
    await db.run(`DELETE FROM templates WHERE id = ?;`, [id]);
    return;
  }
  await webDb.templates.delete(id);
}
