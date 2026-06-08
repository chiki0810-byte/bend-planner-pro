// ---------------------------------------------------------
// MÓDULO 14 — MOTOR UNIVERSAL DE MÁQUINAS
// ---------------------------------------------------------
// Define las máquinas reales del taller y las categorías
// universales para que la app funcione en cualquier taller.
// ---------------------------------------------------------

// ---------------------------------------------------------
// 14.1 — TIPOS
// ---------------------------------------------------------

export type CategoriaMaquina =
  | "hidraulica_pesada"
  | "hidraulica_media"
  | "hidraulica_ligera"
  | "long_folder"
  | "paneladora"
  | "manual";

export interface Maquina {
  nombre: string;
  categoria: CategoriaMaquina;
  longitudUtil: number;   // mm
  apertura: number;       // mm
  garganta: number;       // mm
  puedeMachacar: boolean;
  puedeDoble: boolean;
  espesorMax: number;     // mm
}

// ---------------------------------------------------------
// 14.2 — MÁQUINAS REALES DEL TALLER
// ---------------------------------------------------------

export const maquinasTaller: Maquina[] = [
  {
    nombre: "Estefan VH 8m",
    categoria: "hidraulica_pesada",
    longitudUtil: 8000,
    apertura: 400,
    garganta: 350,
    puedeMachacar: true,
    puedeDoble: true,
    espesorMax: 3
  },
  {
    nombre: "Estefan 6m",
    categoria: "hidraulica_media",
    longitudUtil: 6000,
    apertura: 180,
    garganta: 250,
    puedeMachacar: true,
    puedeDoble: true,
    espesorMax: 2
  },
  {
    nombre: "Jordi 2000 PH",
    categoria: "hidraulica_ligera",
    longitudUtil: 3000,
    apertura: 120,
    garganta: 200,
    puedeMachacar: false,
    puedeDoble: false,
    espesorMax: 2
  },
  {
    nombre: "JORNS Maxi Line 200SW",
    categoria: "long_folder",
    longitudUtil: 6000,
    apertura: 120,
    garganta: 0,
    puedeMachacar: false,
    puedeDoble: false,
    espesorMax: 1
  }
];

// ---------------------------------------------------------
// 14.3 — CATEGORÍAS UNIVERSALES (para cualquier taller)
// ---------------------------------------------------------

export const categoriasUniversales: Record<CategoriaMaquina, Partial<Maquina>> = {
  hidraulica_pesada: {
    puedeMachacar: true,
    puedeDoble: true,
    apertura: 350,
    espesorMax: 3
  },
  hidraulica_media: {
    puedeMachacar: true,
    puedeDoble: true,
    apertura: 150,
    espesorMax: 2
  },
  hidraulica_ligera: {
    puedeMachacar: false,
    puedeDoble: false,
    apertura: 120,
    espesorMax: 2
  },
  long_folder: {
    puedeMachacar: false,
    puedeDoble: false,
    apertura: 120,
    espesorMax: 1
  },
  paneladora: {
    puedeMachacar: false,
    puedeDoble: false,
    apertura: 100,
    espesorMax: 1
  },
  manual: {
    puedeMachacar: false,
    puedeDoble: false,
    apertura: 80,
    espesorMax: 0.8
  }
};
