// BLOQUE 2.5 — Remates Desiguales
// Cálculo industrial avanzado para alas A/B distintas y corte cejo.
// No sustituye a software profesional; ofrece BA, BD y desarrollo calculados
// y corrección por longitud antes de programar la pieza.
//
// ORGANIZACIÓN DEL ARCHIVO (etapa de separación conceptual):
//   SECCIÓN A — MATEMÁTICA FÍSICA DEL PLEGADO
//     · K aprobado por material y espesor
//     · BA calculado con calculateBendMath() de bendCalc.ts
//   SECCIÓN B — CORRECCIONES EMPÍRICAS EXISTENTES (fabricación)
//     · corrección por alas desiguales (5 %)
//     · corrección por longitud (2 %)
//     · reducción por corte cejo (5 %)
//   SECCIÓN C — COMPOSICIÓN DEL RESULTADO (BD, alas finales, desarrollo)
//
// NOTA: los porcentajes de la SECCIÓN B NO son fórmulas físicas universales;
// son ajustes empíricos heredados. Se mantienen aquí exactamente igual que
// antes para no alterar los ajustes de fabricación.

import type { ValidacionResultado } from "./validarPieza";
import { ANGULO_MAXIMO_PLEGABLE, esAnguloCritico } from "./limitesAnguloPlegado";
import {
  calculateBendMath,
  getMaterialDefaultsByThickness,
  isValidMaterialDefaults,
  type DefaultsByThickness,
} from "./bendCalc";

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
  /** Lista opcional de pliegues físicos individuales.
   *  Si existe y tiene elementos, la BA se calcula pliegue a pliegue. */
  pliegues?: PliegueFisico[];
  /** NUEVO (opcional): suma de las longitudes de los tramos rectos
   *  introducidos en pantalla. Sólo se usa en modo multi-pliegue. */
  sumaTramos?: number;
  /** Longitudes individuales para validar que no haya tramos vacíos. */
  tramos?: number[];
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
  valido: boolean;
  ba: number;              // Bend Allowance
  bd: number;              // Bend Deduction (BA + corrección por alas desiguales)
  kFactor: number;
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

/** Parámetros físicos de UN pliegue individual. Cada pliegue puede tener
 *  su propio ángulo, radio, espesor y K. */
export interface PliegueFisico {
  angulo: number;
  espesor: number;
  radio: number;
  /** K aprobado para el material y espesor del pliegue. */
  k?: number;
}

export type RemateDefaultsLookup = (
  material: string,
  espesor: number,
) => DefaultsByThickness | undefined;

const resultadoInvalido = (
  alaA: number,
  alaB: number,
  mensaje: string,
): RemateResultado => ({
  valido: false,
  ba: 0,
  bd: 0,
  kFactor: 0,
  correccionLongitud: 0,
  reduccionCejo: 0,
  desarrolloTotal: 0,
  alaAFinal: alaA,
  alaBFinal: alaB,
  avisos: [{ nivel: "error", mensaje }],
});

/** FÍSICA: BA = (π/180)·θ·(R + K·t) — delegado íntegramente en
 *  calculateBendMath() (src/lib/bendCalc.ts). Redondeo interno a 3 decimales,
 *  idéntico al comportamiento previo. */
export function calcularBAPliegue(p: PliegueFisico): number {
  if (p.k === undefined || !Number.isFinite(p.k)) {
    throw new Error("El pliegue requiere un factor K aprobado.");
  }
  return +calculateBendMath({
    angle: p.angulo,
    thickness: p.espesor,
    innerRadius: p.radio,
    kFactor: p.k,
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


export function calcularRemateDesigual(
  input: RemateInput,
  getDefaults: RemateDefaultsLookup = getMaterialDefaultsByThickness,
): RemateResultado {
  const { alaA, alaB, espesor, radio, angulo, tipo } = input;
  const avisos: RemateAviso[] = [];

  const sumaCoherente = input.sumaTramos === undefined ||
    Math.abs(input.sumaTramos - input.longitudTotal) < 0.001;
  const tramosCoherentes = input.tramos === undefined || (
    input.tramos.length >= 2 &&
    input.tramos.every((longitud) => Number.isFinite(longitud) && longitud > 0) &&
    Math.abs(input.tramos[0] - alaA) < 0.001 &&
    Math.abs(input.tramos[input.tramos.length - 1] - alaB) < 0.001 &&
    (input.sumaTramos === undefined ||
      Math.abs(input.tramos.reduce((suma, longitud) => suma + longitud, 0) - input.sumaTramos) < 0.001)
  );
  const plieguesEsperados = Math.max((input.tramos?.length ?? 2) - 1, 1);
  const cantidadPlieguesSolicitados = input.pliegues?.length || 1;
  const plieguesCoherentes = input.tramos === undefined || cantidadPlieguesSolicitados === plieguesEsperados;
  if (!Number.isFinite(input.longitudTotal) || input.longitudTotal <= 0 ||
      !Number.isFinite(alaA) || alaA <= 0 ||
      !Number.isFinite(alaB) || alaB <= 0 ||
      (input.sumaTramos !== undefined && (!Number.isFinite(input.sumaTramos) || input.sumaTramos <= 0)) ||
      !sumaCoherente ||
      !tramosCoherentes ||
      !plieguesCoherentes) {
    return resultadoInvalido(
      alaA,
      alaB,
      !plieguesCoherentes
        ? "Debe haber un pliegue entre cada par de tramos. No se calcula un desarrollo válido."
        : "Las longitudes de los tramos y las alas deben ser positivas y coherentes. No se calcula un desarrollo válido.",
    );
  }

  // --- A) FÍSICA -----------------------------------------------------------
  // Modo multi-pliegue: cada pliegue con su ángulo/radio/espesor/K propios.
  // Modo sin lista: un único pliegue.
  const multi = Array.isArray(input.pliegues) && input.pliegues.length > 0;
  const plieguesSolicitados: PliegueFisico[] = multi
    ? input.pliegues!
    : [{ angulo, espesor, radio }];
  const listaPliegues: PliegueFisico[] = [];
  for (const [index, pliegue] of plieguesSolicitados.entries()) {
    const defaults = getDefaults(input.material, pliegue.espesor);
    const espesorValido = Number.isFinite(pliegue.espesor) && pliegue.espesor > 0;
    const anguloValido = Number.isFinite(pliegue.angulo) && pliegue.angulo > 0 && pliegue.angulo < 180;
    if (!espesorValido || !anguloValido) {
      return resultadoInvalido(
        alaA,
        alaB,
        "El ángulo o el espesor del pliegue no son válidos. No se calcula un desarrollo válido.",
      );
    }
    if (pliegue.angulo > ANGULO_MAXIMO_PLEGABLE) {
      return resultadoInvalido(
        alaA,
        alaB,
        `Pliegue ${index + 1}: ángulo ${pliegue.angulo}° fuera del rango plegable (>160°). No se calcula un desarrollo válido.`,
      );
    }
    if (!isValidMaterialDefaults(defaults)) {
      return resultadoInvalido(
        alaA,
        alaB,
        `No hay K y radio aprobados válidos para ${input.material || "el material seleccionado"} con espesor ${pliegue.espesor} mm. No se calcula un desarrollo válido.`,
      );
    }
    listaPliegues.push({ ...pliegue, k: defaults.kFactor, radio: defaults.innerRadius });
  }
  const baPorPliegue = listaPliegues.map((p) => calcularBAPliegue(p));
  const ba = sumarBAPliegues(listaPliegues);
  const k = listaPliegues[0].k!;

  listaPliegues.forEach((pliegue, index) => {
    if (esAnguloCritico(pliegue.angulo)) {
      avisos.push({
        nivel: "warn",
        mensaje: `Pliegue ${index + 1}: ángulo ${pliegue.angulo}° crítico, puede requerir dos pasadas.`,
      });
    }
  });


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
    valido: true,
    ba,
    bd,
    kFactor: k,
    correccionLongitud,
    reduccionCejo,
    desarrolloTotal,
    alaAFinal,
    alaBFinal,
    desglose: { tramosRectos, sumaBA: ba, correccionesFabricacion },
    baPorPliegue,


    avisos,
  };
}
