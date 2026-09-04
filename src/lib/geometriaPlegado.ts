// ---------------------------------------------------------
// ETAPA 5A — MOTOR GEOMÉTRICO DE COTAS INTERIORES
// ---------------------------------------------------------
// Modelo: SEGMENTO → PLIEGUE → SEGMENTO → ... → SEGMENTO
// Para n segmentos hay n-1 pliegues.
//
// Este módulo NO redefine ninguna fórmula: reutiliza
// calculateBendMath() de src/lib/bendCalc.ts
//   BA  = θrad × (R + K × T)
//   OSSB= tan(θ/2) × (R + T)
//   BD  = 2 × OSSB − BA
//
// Cada pliegue produce su propio BA / OSSB / BD.
// NO se calcula una BD global repartida.
// El cálculo interno es decimal: aquí no se redondea.
// ---------------------------------------------------------

import { calculateBendMath, type BendMathOutput } from "./bendCalc";

// ---------------------------------------------------------
// 1 — TIPOS
// ---------------------------------------------------------

export type DimensionReference =
  | "inside"
  | "outside"
  | "mold_line"
  | "tangent"
  | "neutral";

export interface BendGeometry {
  id: string;
  angleDeg: number;
  radius: number;
  thickness: number;
  kFactor: number;
  material?: string;
}

export interface SegmentDimension {
  id: string;
  dimension: number;
  dimensionReference: DimensionReference;
  leftBendId?: string;
  rightBendId?: string;
}

/** Resultado matemático de un pliegue individual. */
export interface BendResult extends BendMathOutput {
  id: string;
  angleDeg: number;
  radius: number;
  thickness: number;
  kFactor: number;
}

export type SegmentStatus =
  | "ok"
  /** La referencia de cota requiere una transformación geométrica
   *  todavía no implementada (outside / mold_line). */
  | "requires_transform";

export interface SegmentDevelopment {
  id: string;
  nominalDimension: number;
  flatLength: number | null;
  correctionLeft: number;
  correctionRight: number;
  totalCorrection: number;
  dimensionReference: DimensionReference;
  status: SegmentStatus;
  note?: string;
}

export interface ProfileDevelopmentResult {
  valid: boolean;
  error?: string;
  bends: BendResult[];
  segments: SegmentDevelopment[];
  /** Suma de flatLength de todos los segmentos (null si alguno no es calculable). */
  totalFlatLength: number | null;
  /** Suma de las correcciones de todos los segmentos (decimal, sin redondear). */
  totalCorrection: number;
  /** Suma de las cotas nominales. */
  totalNominalDimension: number;
}

// ---------------------------------------------------------
// 2 — CÁLCULO INDIVIDUAL DE UN PLIEGUE
// ---------------------------------------------------------

export function calculateBendGeometry(bend: BendGeometry): BendResult {
  const math = calculateBendMath({
    angle: bend.angleDeg,
    thickness: bend.thickness,
    innerRadius: bend.radius,
    kFactor: bend.kFactor,
  });

  return {
    id: bend.id,
    angleDeg: bend.angleDeg,
    radius: bend.radius,
    thickness: bend.thickness,
    kFactor: bend.kFactor,
    ...math,
  };
}

// ---------------------------------------------------------
// 3 — DESARROLLO DE UN SEGMENTO
// ---------------------------------------------------------

export function calculateSegmentDevelopment(
  segment: SegmentDimension,
  leftBend?: BendResult | null,
  rightBend?: BendResult | null,
): SegmentDevelopment {
  const ref = segment.dimensionReference;
  const base: Omit<SegmentDevelopment, "flatLength" | "correctionLeft" | "correctionRight" | "totalCorrection" | "status" | "note"> = {
    id: segment.id,
    nominalDimension: segment.dimension,
    dimensionReference: ref,
  };

  if (ref === "inside") {
    // Cota interior: se descuenta la mitad del BD de cada pliegue adyacente.
    const correctionLeft = leftBend ? -leftBend.bendDeduction / 2 : 0;
    const correctionRight = rightBend ? -rightBend.bendDeduction / 2 : 0;
    const totalCorrection = correctionLeft + correctionRight;
    return {
      ...base,
      flatLength: segment.dimension + totalCorrection,
      correctionLeft,
      correctionRight,
      totalCorrection,
      status: "ok",
    };
  }

  if (ref === "tangent" || ref === "neutral") {
    // De momento la cota se toma tal cual (sin corrección definida aún).
    return {
      ...base,
      flatLength: segment.dimension,
      correctionLeft: 0,
      correctionRight: 0,
      totalCorrection: 0,
      status: "ok",
    };
  }

  // outside / mold_line: NO se aproxima. Requiere transformación específica.
  return {
    ...base,
    flatLength: null,
    correctionLeft: 0,
    correctionRight: 0,
    totalCorrection: 0,
    status: "requires_transform",
    note:
      ref === "outside"
        ? "La cota exterior requiere una transformación geométrica específica (aún no implementada)."
        : "La cota a línea de molde (mold line) requiere una transformación geométrica específica (aún no implementada).",
  };
}

// ---------------------------------------------------------
// 4 — DESARROLLO DEL PERFIL COMPLETO
// ---------------------------------------------------------

export function calculateProfileDevelopment(
  segments: SegmentDimension[],
  bends: BendGeometry[],
): ProfileDevelopmentResult {
  const empty: ProfileDevelopmentResult = {
    valid: false,
    bends: [],
    segments: [],
    totalFlatLength: null,
    totalCorrection: 0,
    totalNominalDimension: 0,
  };

  if (segments.length !== bends.length + 1) {
    return {
      ...empty,
      error: `Cadena geométrica inválida: ${segments.length} segmentos y ${bends.length} pliegues (se esperaban ${bends.length + 1} segmentos).`,
    };
  }

  const bendResults = bends.map(calculateBendGeometry);

  const segmentResults = segments.map((seg, i) =>
    calculateSegmentDevelopment(
      seg,
      i > 0 ? bendResults[i - 1] : null,
      i < bendResults.length ? bendResults[i] : null,
    ),
  );

  const anyMissing = segmentResults.some((s) => s.flatLength === null);

  return {
    valid: true,
    bends: bendResults,
    segments: segmentResults,
    totalFlatLength: anyMissing
      ? null
      : segmentResults.reduce((s, r) => s + (r.flatLength as number), 0),
    totalCorrection: segmentResults.reduce((s, r) => s + r.totalCorrection, 0),
    totalNominalDimension: segmentResults.reduce((s, r) => s + r.nominalDimension, 0),
  };
}

// ---------------------------------------------------------
// 5 — HELPER: construir la cadena a partir de cotas y pliegues
// ---------------------------------------------------------

export function buildProfile(
  dimensions: number[],
  bends: BendGeometry[],
  dimensionReference: DimensionReference = "inside",
): { segments: SegmentDimension[]; bends: BendGeometry[] } {
  const segments: SegmentDimension[] = dimensions.map((dimension, i) => ({
    id: `S${i + 1}`,
    dimension,
    dimensionReference,
    leftBendId: i > 0 ? bends[i - 1]?.id : undefined,
    rightBendId: i < bends.length ? bends[i]?.id : undefined,
  }));
  return { segments, bends };
}
