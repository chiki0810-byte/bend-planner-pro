// Cálculos profesionales de plegado de chapa
// Fórmula estándar Bend Allowance (DIN 6935 / SheetMetal):
//   BA = (π/180) * angle * (R + K * t)
// donde:
//   angle = ángulo de plegado en grados (complementario al doblado)
//   R     = radio interior (mm)
//   K     = factor K (posición fibra neutra)
//   t     = espesor (mm)

export type BendDirectionLabel = 'up' | 'down';

/** Campos de metadatos preparados para futuras funciones (marcado, compensación,
 *  cotas críticas, secuencia, remates). No afectan a ningún cálculo actual. */
export interface BendMetadata {
  associatedDimension: number | null;
  criticalDimension: boolean;
  compensationAllowed: boolean;
  compensationAmount: number;
  dimensionReference: "inside" | "outside" | null;
}

export const DEFAULT_BEND_METADATA: BendMetadata = {
  associatedDimension: null,
  criticalDimension: false,
  compensationAllowed: false,
  compensationAmount: 0,
  dimensionReference: null,
};

export const directionLabel = (d: 1 | -1): BendDirectionLabel => (d === -1 ? 'down' : 'up');

export interface BendInput extends Partial<BendMetadata> {
  angle: number;         // grados de plegado (ángulo de la operación)
  distance: number;      // distancia desde plegado anterior o borde (mm)
  innerRadius?: number;  // radio interior (mm), si vacío => 1.5 * t
  kFactor?: number;      // factor K, si vacío => valor por defecto del material
  direction?: 1 | -1;    // +1 hacia arriba, -1 hacia abajo
  tolerance?: number;    // tolerancia +/- (mm)
}

export interface BendOutput extends BendMetadata {
  order: number;
  angle: number;
  distanceFromPrevious: number;
  innerRadius: number;
  thickness: number;
  kFactor: number;
  direction: 1 | -1;
  directionLabel: BendDirectionLabel;
  tolerance: number;
  bendAllowance: number;
  bendDeduction: number;
  outsideSetback: number;
}


export interface DefaultsByThickness {
  bendAllowance90: number; // referencia (no se usa para cálculo si hay fórmula)
  kFactor: number;
  innerRadius: number;
}

// Defaults estándar por espesor (editables vía panel de materiales)
export const DEFAULT_THICKNESS_TABLE: Record<number, DefaultsByThickness> = {
  0.5: { bendAllowance90: 0.8, kFactor: 0.33, innerRadius: 0.8 },
  0.6: { bendAllowance90: 1.0, kFactor: 0.33, innerRadius: 1.0 },
  0.8: { bendAllowance90: 1.3, kFactor: 0.35, innerRadius: 1.2 },
  1.0: { bendAllowance90: 1.6, kFactor: 0.38, innerRadius: 1.5 },
  1.2: { bendAllowance90: 1.9, kFactor: 0.40, innerRadius: 1.8 },
  1.5: { bendAllowance90: 2.4, kFactor: 0.42, innerRadius: 2.2 },
};

export interface BendMathInput {
  angle: number;
  thickness: number;
  innerRadius: number;
  kFactor: number;
}

export interface BendMathOutput {
  bendAllowance: number;
  outsideSetback: number;
  bendDeduction: number;
}

export function calculateBendMath(input: BendMathInput): BendMathOutput {
  const angleRad = (Math.PI / 180) * input.angle;
  const bendAllowance = angleRad * (input.innerRadius + input.kFactor * input.thickness);
  // Outside setback: OSSB = tan(angle/2) * (R + t)
  const outsideSetback = Math.tan((Math.PI / 180) * (input.angle / 2)) * (input.innerRadius + input.thickness);
  const bendDeduction = 2 * outsideSetback - bendAllowance;

  return {
    bendAllowance,
    outsideSetback,
    bendDeduction,
  };
}

export function computeBend(
  input: BendInput,
  thickness: number,
  defaults: DefaultsByThickness,
  order: number,
): BendOutput {
  const t = thickness;
  const R = input.innerRadius ?? defaults.innerRadius;
  const K = input.kFactor ?? defaults.kFactor;
  const { bendAllowance, outsideSetback, bendDeduction } = calculateBendMath({
    angle: input.angle,
    thickness: t,
    innerRadius: R,
    kFactor: K,
  });

  const direction = input.direction ?? 1;

  return {
    order,
    angle: input.angle,
    distanceFromPrevious: input.distance,
    innerRadius: round(R),
    thickness: t,
    kFactor: round(K, 3),
    direction,
    directionLabel: directionLabel(direction),
    tolerance: input.tolerance ?? 0.1,
    bendAllowance: round(bendAllowance),
    bendDeduction: round(bendDeduction),
    outsideSetback: round(outsideSetback),
    associatedDimension: input.associatedDimension ?? DEFAULT_BEND_METADATA.associatedDimension,
    criticalDimension: input.criticalDimension ?? DEFAULT_BEND_METADATA.criticalDimension,
    compensationAllowed: input.compensationAllowed ?? DEFAULT_BEND_METADATA.compensationAllowed,
    compensationAmount: input.compensationAmount ?? DEFAULT_BEND_METADATA.compensationAmount,
    dimensionReference: input.dimensionReference ?? DEFAULT_BEND_METADATA.dimensionReference,
  };
}
/* ────────────────────────────────────────────────────────────────────────────
 * DESARROLLO — CAPAS SEPARADAS (motor único)
 *
 * SEMÁNTICA ACTUAL DE `pieceLength` (documentada, NO modificada):
 *   `pieceLength` es la LONGITUD DE PIEZA introducida por el usuario en la
 *   calculadora. Hoy NO está definido de forma inequívoca si corresponde a
 *   cotas interiores, exteriores o a la suma de tramos rectos; por tanto
 *   NO se cambia la fórmula de desarrollo. Se conserva exactamente:
 *
 *       desarrolloTeorico = pieceLength + Σ BA
 *
 * CAPAS PREVISTAS (estructura ya preparada, sin cambiar resultados):
 *   1) cotas introducidas .......... inputLength
 *   2) desarrollo teórico .......... theoreticalDevelopedLength
 *   3) corrección de taller ........ workshopCorrection (HOY SIEMPRE 0 mm)
 *   4) corte final ................. finalCutLength = 2 + 3
 *
 * La corrección de taller (−1, −4, −7 mm, etc.) se implementará más adelante
 * como capa independiente; NO se mezcla con K, BA ni BD.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface DevelopmentBreakdown {
  /** Cotas/longitud introducidas por el usuario (sin transformar). */
  inputLength: number;
  /** Suma de Bend Allowance de todos los plegados. */
  totalBendAllowance: number;
  /** Suma de Bend Deduction de todos los plegados (informativo). */
  totalBendDeduction: number;
  /** Suma de Outside Setback de todos los plegados (informativo). */
  totalOutsideSetback: number;
  /** Desarrollo teórico = inputLength + Σ BA. */
  theoreticalDevelopedLength: number;
  /** Corrección real de taller. Capa independiente; hoy siempre 0. */
  workshopCorrection: number;
  /** Corte final = desarrollo teórico + corrección de taller. */
  finalCutLength: number;
}

/** Motor único de desarrollo. No introduce fórmulas nuevas: reutiliza las BA
 *  ya calculadas por computeBend()/calculateBendMath(). */
export function computeDevelopment(
  pieceLength: number,
  bends: BendOutput[],
  workshopCorrection = 0,
): DevelopmentBreakdown {
  const totalBendAllowance = round(bends.reduce((s, b) => s + b.bendAllowance, 0));
  const totalBendDeduction = round(bends.reduce((s, b) => s + b.bendDeduction, 0));
  const totalOutsideSetback = round(bends.reduce((s, b) => s + b.outsideSetback, 0));
  const theoreticalDevelopedLength = round(pieceLength + totalBendAllowance);
  const finalCutLength = round(theoreticalDevelopedLength + workshopCorrection);

  return {
    inputLength: pieceLength,
    totalBendAllowance,
    totalBendDeduction,
    totalOutsideSetback,
    theoreticalDevelopedLength,
    workshopCorrection,
    finalCutLength,
  };
}

function round(v: number, d = 2) {
  const f = Math.pow(10, d);
  return Math.round(v * f) / f;
}
