import Dexie, { Table } from 'dexie';
import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';

export interface SavedPiece {
  id?: number;
  name: string;
  createdAt: number;
  thickness: number;
  material: string;
  pieceLength: number;
  payload: string; // JSON con bends + result
}

// ---------- Web fallback (Dexie / IndexedDB) ----------
class WebDB extends Dexie {
  pieces!: Table<SavedPiece, number>;
  constructor() {
    super('plegado-db');
    this.version(1).stores({
      pieces: '++id, name, createdAt, material, thickness',
    });
  }
}

const webDb = new WebDB();

// ---------- Native SQLite (Android / Electron) ----------
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
      name TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      thickness REAL NOT NULL,
      material TEXT NOT NULL,
      pieceLength REAL NOT NULL,
      payload TEXT NOT NULL
    );
  `);
  return sqliteConn;
}

// ---------- Public API ----------
export async function savePiece(p: Omit<SavedPiece, 'id' | 'createdAt'>): Promise<number> {
  const row: SavedPiece = { ...p, createdAt: Date.now() };
  if (isNative()) {
    const db = await getNativeDb();
    const res = await db.run(
      `INSERT INTO pieces (name, createdAt, thickness, material, pieceLength, payload)
       VALUES (?, ?, ?, ?, ?, ?);`,
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
