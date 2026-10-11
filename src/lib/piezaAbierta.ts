// ---------------------------------------------------------
// MODELO DE DOMINIO — PIEZA ABIERTA (solo estructura)
// ---------------------------------------------------------
// Cadena abierta: S1 → P1 → S2 → … → P(N-1) → SN
// - Segmentos y pliegues son colecciones distintas.
// - N segmentos ⇔ N-1 pliegues; el último segmento es explícito.
// - La referencia dimensional es obligatoria y nunca se infiere.
// - No hay valores por defecto de material / K / radio.
// - Cotas introducidas, desarrollo teórico y correcciones de taller
//   se mantienen separados. Este módulo NO calcula nada.
// ---------------------------------------------------------

import type { DimensionReference } from "./profileTypes";

export type { DimensionReference };

export const DIMENSION_REFERENCES: readonly DimensionReference[] = [
  "inside",
  "outside",
  "tangent",
] as const;

/** Cota introducida por el usuario para un tramo recto. */
export interface SegmentoPieza {
  id: string;
  cota: number;
  referencia: DimensionReference;
}

/** Pliegue entre dos segmentos consecutivos (ids explícitos). */
export interface PlieguePieza {
  id: string;
  anguloGrados: number;
  orientacion: "up" | "down";
  segmentoAnteriorId: string;
  segmentoSiguienteId: string;
}

/** Parámetros de material: todos explícitos, sin defaults. */
export interface ParametrosMaterialPieza {
  material: string;
  espesor: number;
  kFactor: number;
  radioInterior: number;
}

/** Placeholder: el desarrollo teórico aún no se calcula aquí. */
export interface DesarrolloTeoricoPieza {
  longitudPlana: number;
}

export interface CorreccionTallerPieza {
  id: string;
  valor: number;
  motivo: string;
}

export interface PiezaAbierta {
  id: string;
  segmentos: SegmentoPieza[];
  pliegues: PlieguePieza[];
  /** Ausente = no definido. Nunca se rellena automáticamente. */
  parametrosMaterial?: ParametrosMaterialPieza;
  /** null hasta que exista un motor que lo calcule. */
  desarrolloTeorico: DesarrolloTeoricoPieza | null;
  correccionesTaller: CorreccionTallerPieza[];
}

export type CodigoErrorEstructura =
  | "SIN_SEGMENTOS"
  | "COLECCIONES_COMPARTIDAS"
  | "NUMERO_PLIEGUES"
  | "ID_DUPLICADO"
  | "REFERENCIA_AUSENTE"
  | "REFERENCIA_INVALIDA"
  | "COTA_INVALIDA"
  | "ANGULO_INVALIDO"
  | "ORIENTACION_INVALIDA"
  | "ENLACE_INCORRECTO";

export interface ErrorEstructura {
  codigo: CodigoErrorEstructura;
  mensaje: string;
  id?: string;
}

export interface ResultadoEstructura {
  valida: boolean;
  errores: ErrorEstructura[];
}

const esNumeroFinito = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

/**
 * Valida SOLO la estructura de la cadena. No modifica la pieza,
 * no infiere referencias y no comprueba rangos físicos.
 */
export function validarEstructuraPiezaAbierta(pieza: PiezaAbierta): ResultadoEstructura {
  const errores: ErrorEstructura[] = [];
  const segs = pieza.segmentos ?? [];
  const plgs = pieza.pliegues ?? [];

  if ((segs as unknown) === (plgs as unknown)) {
    errores.push({ codigo: "COLECCIONES_COMPARTIDAS", mensaje: "Segmentos y pliegues deben ser colecciones distintas." });
  }

  if (segs.length === 0) {
    errores.push({ codigo: "SIN_SEGMENTOS", mensaje: "La pieza necesita al menos un segmento." });
    return { valida: false, errores };
  }

  if (plgs.length !== segs.length - 1) {
    errores.push({
      codigo: "NUMERO_PLIEGUES",
      mensaje: `${segs.length} segmentos requieren ${segs.length - 1} pliegues (hay ${plgs.length}).`,
    });
  }

  const ids = new Set<string>();
  for (const x of [...segs, ...plgs]) {
    if (ids.has(x.id)) errores.push({ codigo: "ID_DUPLICADO", mensaje: `Id duplicado: ${x.id}.`, id: x.id });
    ids.add(x.id);
  }

  segs.forEach((s) => {
    const ref = (s as { referencia?: unknown }).referencia;
    if (ref === undefined || ref === null) {
      errores.push({ codigo: "REFERENCIA_AUSENTE", mensaje: `Segmento ${s.id}: referencia dimensional obligatoria.`, id: s.id });
    } else if (!DIMENSION_REFERENCES.includes(ref as DimensionReference)) {
      errores.push({ codigo: "REFERENCIA_INVALIDA", mensaje: `Segmento ${s.id}: referencia "${String(ref)}" no admitida.`, id: s.id });
    }
    if (!esNumeroFinito(s.cota)) {
      errores.push({ codigo: "COTA_INVALIDA", mensaje: `Segmento ${s.id}: cota no numérica.`, id: s.id });
    }
  });

  plgs.forEach((p, i) => {
    if (!esNumeroFinito(p.anguloGrados)) {
      errores.push({ codigo: "ANGULO_INVALIDO", mensaje: `Pliegue ${p.id}: ángulo no numérico.`, id: p.id });
    }
    if (p.orientacion !== "up" && p.orientacion !== "down") {
      errores.push({ codigo: "ORIENTACION_INVALIDA", mensaje: `Pliegue ${p.id}: orientación no válida.`, id: p.id });
    }
    const ant = segs[i]?.id;
    const sig = segs[i + 1]?.id;
    if (p.segmentoAnteriorId !== ant || p.segmentoSiguienteId !== sig) {
      errores.push({
        codigo: "ENLACE_INCORRECTO",
        mensaje: `Pliegue ${p.id} debe unir ${ant ?? "?"} → ${sig ?? "?"}.`,
        id: p.id,
      });
    }
  });

  return { valida: errores.length === 0, errores };
}
