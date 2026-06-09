// ---------------------------------------------------------
// MÓDULO 16 — REGLAS INDUSTRIALES DE PROCESO
// ---------------------------------------------------------
// Aquí se definen las reglas que clasifican la pieza,
// detectan ala machacada, tipo de pieza y modo de trabajo.
// ---------------------------------------------------------

import type { Pieza, Pliegue } from "./uiIndustrial";

// ---------------------------------------------------------
// 16.1 — TIPOS AUXILIARES
// ---------------------------------------------------------

export type TipoPieza =
  | "remate"
  | "u_profunda"
  | "canal"
  | "especial"
  | "generica";

export type ModoTrabajo = "individual" | "doble" | "no_recomendado";

export interface AnalisisProceso {
  tipoPieza: TipoPieza;
  tieneAlaMachacada: boolean;
  modoTrabajo: ModoTrabajo;
  avisos: string[];
}

// ---------------------------------------------------------
// 16.2 — DETECCIÓN DE ALA MACHACADA
// ---------------------------------------------------------
// Criterio simple: alas muy pequeñas (p.ej. < 20 mm)
// se consideran "ala machacada" y requieren herramienta
// especial o pliegue previo.

export function detectarAlaMachacada(pieza: Pieza): boolean {
  if (!pieza.pliegues || pieza.pliegues.length === 0) return false;

  const UMBRAL_ALA_PEQUENA = 20; // mm

  return pieza.pliegues.some((p: Pliegue) => p.longitud > 0 && p.longitud < UMBRAL_ALA_PEQUENA);
}

// ---------------------------------------------------------
// 16.3 — DETECCIÓN DE TIPO DE PIEZA
// ---------------------------------------------------------
// Criterios simples basados en número de pliegues y proporciones.

export function detectarTipoPieza(pieza: Pieza): TipoPieza {
  const n = pieza.pliegues.length;

  if (n === 2) {
    // Remate típico: dos pliegues, ángulos ~90
    const angulos = pieza.pliegues.map(p => p.angulo);
    const cercaDe90 = angulos.every(a => a > 80 && a < 100);
    if (cercaDe90) return "remate";
  }

  if (n === 3) {
    // U o canal
    const longitudes = pieza.pliegues.map(p => p.longitud).sort((a, b) => a - b);
    const alaPequena = longitudes[0];
    const alaGrande = longitudes[2];

    if (alaGrande > 3 * alaPequena) {
      return "u_profunda";
    }
    return "canal";
  }

  if (n > 3) {
    return "especial";
  }

  return "generica";
}

// ---------------------------------------------------------
// 16.4 — MODO DE TRABAJO (INDIVIDUAL / DOBLE)
// ---------------------------------------------------------
// Regla simple:
// - Remate: doble permitido
// - U profunda / canal: doble no recomendado
// - Especial: individual
// - Genérica: individual

export function determinarModoTrabajo(tipo: TipoPieza): ModoTrabajo {
  switch (tipo) {
    case "remate":
      return "doble";
    case "u_profunda":
    case "canal":
      return "no_recomendado";
    case "especial":
      return "individual";
    default:
      return "individual";
  }
}

// ---------------------------------------------------------
// 16.5 — AVISOS INDUSTRIALES BASE
// ---------------------------------------------------------

export function generarAvisosBase(
  pieza: Pieza,
  tipo: TipoPieza,
  tieneAlaMachacada: boolean,
  modo: ModoTrabajo
): string[] {
  const avisos: string[] = [];

  if (tieneAlaMachacada) {
    avisos.push("⚠️ La pieza tiene ala machacada. Puede requerir herramienta especial o pliegue previo.");
  }

  if (tipo === "u_profunda" || tipo === "canal") {
    avisos.push("⚠️ Pieza tipo U/canal. Revisar apertura y riesgo de atrapamiento.");
  }

  if (tipo === "especial") {
    avisos.push("ℹ️ Pieza especial de cliente. Revisar proceso antes de producción.");
  }

  if (modo === "no_recomendado") {
    avisos.push("⚠️ Trabajo en doble no recomendado para esta geometría.");
  }

  if (pieza.espesor >= 2) {
    avisos.push("ℹ️ Espesor alto. Confirmar capacidad de máquina y herramienta.");
  }

  return avisos;
}

// ---------------------------------------------------------
// 16.6 — FUNCIÓN PRINCIPAL DE ANÁLISIS DE PROCESO
// ---------------------------------------------------------

export function analizarProcesoIndustrial(pieza: Pieza): AnalisisProceso {
  const tipo = detectarTipoPieza(pieza);
  const ala = detectarAlaMachacada(pieza);
  const modo = determinarModoTrabajo(tipo);
  const avisos = generarAvisosBase(pieza, tipo, ala, modo);

  return {
    tipoPieza: tipo,
    tieneAlaMachacada: ala,
    modoTrabajo: modo,
    avisos
  };
}
