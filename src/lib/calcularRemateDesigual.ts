// BLOQUE 2.5 — Remates Desiguales
// Cálculo industrial avanzado para alas A/B distintas y corte cejo.
// No sustituye a software profesional; ofrece BA, BD, K dinámico
// y corrección por longitud antes de programar la pieza.
//
// ORGANIZACIÓN DEL ARCHIVO (etapa de separación conceptual):
//   SECCIÓN A — MATEMÁTICA FÍSICA DEL PLEGADO
//     · K dinámico (estimación de fibra neutra)
//     · BA calculado con calculateBendMath() de bendCalc.ts
//   SECCIÓN B — CORRECCIONES EMPÍRICAS EXISTENTES (fabricación)
//     · corrección por alas desiguales (5 %)
//     · corrección por longitud (2 %)
//     · reducción por corte cejo (5 %)
//   SECCIÓN C — COMPOSICIÓN DEL RESULTADO (BD, alas finales, desarrollo)
//
// NOTA: los porcentajes de la SECCIÓN B NO son fórmulas físicas universales;
// son ajustes empíricos heredados. Se mantienen aquí exactamente igual que
// antes para no alterar resultados, pero aislados para poder sustituirlos
// más adelante por valores calibrados con casos reales de taller.

import type { ValidacionResultado } from "./validarPieza";
import { calculateBendMath } from "./bendCalc";

export type TipoRemate = "normal" | "cejo";

export interface RemateInput {
  longitudTotal: number;
  alaA: number;
  alaB: number;
  espesor: number;
  radio: number;
  angulo: number; // grados
  material: string;
  tipo: TipoRemate;
  validacion?: ValidacionResultado;
  /** NUEVO (opcional): lista de pliegues físicos individuales.
   *  Si existe y tiene elementos, la BA se calcula pliegue a pliegue.
   *  Si no existe, se mantiene EXACTAMENTE el comportamiento legacy. */
  pliegues?: PliegueFisico[];
  /** NUEVO (opcional): suma de las longitudes de los tramos rectos
   *  introducidos en pantalla. Sólo se usa en modo multi-pliegue. */
  sumaTramos?: number;
}

export interface RemateAviso {
  nivel: "info" | "warn" | "error";
  mensaje: string;
}

/** Desglose conceptual del desarrollo (informativo, no altera resultados). */
export interface RemateDesglose {
  /** Suma de los tramos rectos solicitados (alas finales). */
  tramosRectos: number;
  /** Suma de las BA físicas de cada pliegue (calculateBendMath). */
  sumaBA: number;
  /** Suma de las correcciones EMPÍRICAS/LEGACY aplicadas. */
  correccionesFabricacion: number;
}

export interface RemateResultado {
  ba: number;              // Bend Allowance
  bd: number;              // Bend Deduction (BA + corrección por alas desiguales)
  kDinamico: number;
  correccionLongitud: number;
  reduccionCejo: number;   // mm restados al lado más corto si tipo=cejo
  desarrolloTotal: number;
  alaAFinal: number;
  alaBFinal: number;
  avisos: RemateAviso[];
  /** Desglose informativo: rectos + BA + correcciones. */
  desglose?: RemateDesglose;
  /** BA individual de cada pliegue (sólo en modo multi-pliegue). */
  baPorPliegue?: number[];
}


/* ────────────────────────────────────────────────────────────────────────────
 * SECCIÓN A — MATEMÁTICA FÍSICA DEL PLEGADO
 * ──────────────────────────────────────────────────────────────────────────── */

/** FÍSICA (aproximada): K dinámico en función de espesor y ángulo.
 *  Tabla heredada; no se modifica en esta etapa. */
function calcularKDinamico(espesor: number, angulo: number): number {
  // base K según espesor (rangos típicos chapa fina)
  let k = 0.33;
  if (espesor <= 0.6) k = 0.38;
  else if (espesor <= 1.0) k = 0.36;
  else if (espesor <= 1.5) k = 0.33;
  else if (espesor <= 2.5) k = 0.31;
  else k = 0.29;
  // ajuste por ángulo: ángulos pequeños tiran hacia menor K
  if (angulo < 60) k -= 0.02;
  else if (angulo > 120) k += 0.02;
  return Math.max(0.2, Math.min(0.5, +k.toFixed(3)));
}

/** Parámetros físicos de UN pliegue individual. Cada pliegue puede tener
 *  su propio ángulo, radio, espesor y K. */
export interface PliegueFisico {
  angulo: number;
  espesor: number;
  radio: number;
  /** Si se omite, se estima con calcularKDinamico(espesor, ángulo). */
  k?: number;
}

/** FÍSICA: BA = (π/180)·θ·(R + K·t) — delegado íntegramente en
 *  calculateBendMath() (src/lib/bendCalc.ts). Redondeo interno a 3 decimales,
 *  idéntico al comportamiento previo. */
export function calcularBAPliegue(p: PliegueFisico): number {
  const k = p.k ?? calcularKDinamico(p.espesor, p.angulo);
  return +calculateBendMath({
    angle: p.angulo,
    thickness: p.espesor,
    innerRadius: p.radio,
    kFactor: k,
  }).bendAllowance.toFixed(3);
}

/** Suma de las BA físicas de una lista de pliegues (uno o varios). */
export function sumarBAPliegues(pliegues: PliegueFisico[]): number {
  return +pliegues.reduce((acc, p) => acc + calcularBAPliegue(p), 0).toFixed(3);
}


/* ────────────────────────────────────────────────────────────────────────────
 * SECCIÓN B — CORRECCIONES EMPÍRICAS EXISTENTES (no físicas)
 * Valores heredados del taller. Aislados para futura calibración.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Factores empíricos existentes. NO son constantes físicas. */
const CORRECCIONES_EMPIRICAS = {
  /** 5 % del desnivel entre alas — se suma al BA para obtener BD. */
  FACTOR_ALAS_DESIGUALES: 0.05,
  /** 2 % del desnivel entre alas — sólo si el desnivel supera 0,5 mm. */
  FACTOR_LONGITUD: 0.02,
  /** Umbral (mm) a partir del cual se aplica la corrección por longitud. */
  UMBRAL_LONGITUD: 0.5,
  /** 5 % del ala más corta — reducción aplicada en corte cejo. */
  FACTOR_CEJO: 0.05,
} as const;

/** EMPÍRICA: corrección por alas desiguales (5 % del desnivel). */
function correccionAlasEmpirica(diff: number): number {
  return +(diff * CORRECCIONES_EMPIRICAS.FACTOR_ALAS_DESIGUALES).toFixed(3);
}

/** EMPÍRICA: corrección por longitud (2 % del desnivel, sólo si Δ > 0,5 mm). */
function correccionLongitudEmpirica(diff: number): number {
  if (diff <= CORRECCIONES_EMPIRICAS.UMBRAL_LONGITUD) return 0;
  return +(diff * CORRECCIONES_EMPIRICAS.FACTOR_LONGITUD).toFixed(3);
}

/** EMPÍRICA: reducción por corte cejo (5 % del ala más corta). */
function reduccionCejoEmpirica(alaA: number, alaB: number): number {
  return +(Math.min(alaA, alaB) * CORRECCIONES_EMPIRICAS.FACTOR_CEJO).toFixed(3);
}

/* ────────────────────────────────────────────────────────────────────────────
 * LIMITACIÓN CONOCIDA — PUNTA A / PUNTA B INDEPENDIENTES (API PENDIENTE)
 *
 * Punta A y Punta B deben poder tener reducciones de fabricación distintas.
 * La estructura pública actual `RemateInput` NO permite representarlas: sólo
 * existe `tipo: "normal" | "cejo"`, y la reducción por cejo se aplica de forma
 * implícita al ala más corta (5 % EMPÍRICO / LEGACY).
 *
 * Campos que faltarían (NO añadidos aquí para no romper la API pública):
 *   · reduccionPuntaA?: number   // mm reales medidos/definidos por taller
 *   · reduccionPuntaB?: number   // mm reales medidos/definidos por taller
 *   · tipoPuntaA / tipoPuntaB    // tipo de remate independiente por punta
 *   · plieguesPuntaA / plieguesPuntaB: PliegueFisico[]  // varios pliegues/punta
 *
 * Mientras no exista esa información real (no se inventan valores), el cálculo
 * mantiene EXACTAMENTE el comportamiento actual.
 * ──────────────────────────────────────────────────────────────────────────── */

/* ────────────────────────────────────────────────────────────────────────────
 * SECCIÓN C — COMPOSICIÓN DEL RESULTADO
 * ──────────────────────────────────────────────────────────────────────────── */


export function calcularRemateDesigual(input: RemateInput): RemateResultado {
  const { alaA, alaB, espesor, radio, angulo, tipo } = input;
  const avisos: RemateAviso[] = [];

  // --- A) FÍSICA -----------------------------------------------------------
  // Modo multi-pliegue: cada pliegue con su ángulo/radio/espesor/K propios.
  // Modo legacy (sin lista): un único pliegue, comportamiento idéntico al previo.
  const multi = Array.isArray(input.pliegues) && input.pliegues.length > 0;
  const listaPliegues: PliegueFisico[] = multi
    ? input.pliegues!
    : [{ angulo, espesor, radio, k: calcularKDinamico(espesor, angulo) }];
  const baPorPliegue = listaPliegues.map((p) => calcularBAPliegue(p));
  const ba = sumarBAPliegues(listaPliegues);
  const k = multi
    ? (listaPliegues[0].k ?? calcularKDinamico(listaPliegues[0].espesor, listaPliegues[0].angulo))
    : calcularKDinamico(espesor, angulo);


  // --- B) CORRECCIONES EMPÍRICAS ------------------------------------------
  const diff = Math.abs(alaA - alaB);

  // EMPÍRICA (5 %): BD = BA + corrección por alas desiguales
  const correccionAlas = correccionAlasEmpirica(diff);
  const bd = +(ba + correccionAlas).toFixed(3);

  // EMPÍRICA (2 %): corrección por longitud si A ≠ B
  const correccionLongitud = correccionLongitudEmpirica(diff);
  if (correccionLongitud > 0) {
    avisos.push({
      nivel: "info",
      mensaje: `Alas desiguales (Δ ${diff.toFixed(1)} mm): aplicando corrección de ${correccionLongitud} mm.`,
    });
  }

  // EMPÍRICA (5 %): corte cejo — reducción en el lado más corto
  let reduccionCejo = 0;
  let alaAFinal = alaA;
  let alaBFinal = alaB;
  if (tipo === "cejo") {
    reduccionCejo = reduccionCejoEmpirica(alaA, alaB);
    if (alaA <= alaB) alaAFinal = +(alaA - reduccionCejo).toFixed(3);
    else alaBFinal = +(alaB - reduccionCejo).toFixed(3);
    avisos.push({
      nivel: "warn",
      mensaje: `Corte cejo: reducción de ${reduccionCejo} mm en el lado más corto.`,
    });
  }

  // Avisos industriales adicionales
  if (Math.min(alaA, alaB) < 10) {
    avisos.push({
      nivel: "error",
      mensaje: "Ala crítica (<10 mm). Verifica antes de plegar.",
    });
  }
  if (diff > Math.max(alaA, alaB) * 0.5) {
    avisos.push({
      nivel: "warn",
      mensaje: "Diferencia entre alas >50%. Riesgo de remate visualmente irregular.",
    });
  }

  // --- C) Desarrollo total: rectos + física (BA) + correcciones empíricas --
  // En modo multi-pliegue los tramos rectos son la suma de TODOS los tramos
  // introducidos, aplicando (si procede) la misma reducción por cejo.
  const reduccionAplicada = (alaA - alaAFinal) + (alaB - alaBFinal);
  const tramosRectos = +(
    (multi && typeof input.sumaTramos === "number"
      ? input.sumaTramos - reduccionAplicada
      : alaAFinal + alaBFinal)
  ).toFixed(3);
  const correccionesFabricacion = +(correccionAlas + correccionLongitud).toFixed(3);
  const desarrolloTotal = +(
    tramosRectos + ba + correccionAlas + correccionLongitud
  ).toFixed(3);


  // Heredar avisos del bloque 4 si existen
  if (input.validacion) {
    input.validacion.avisos
      .filter((a) => a.codigo === "ALA_CORTA" || a.codigo === "REMATE_DESIGUAL")
      .forEach((a) => avisos.push({ nivel: a.nivel, mensaje: `(BLOQUE 4) ${a.mensaje}` }));
  }

  return {
    ba,
    bd,
    kDinamico: k,
    correccionLongitud,
    reduccionCejo,
    desarrolloTotal,
    alaAFinal,
    alaBFinal,
    desglose: { tramosRectos, sumaBA: ba, correccionesFabricacion },

    avisos,
  };
}
