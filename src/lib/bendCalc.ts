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
}

export const DEFAULT_BEND_METADATA: BendMetadata = {
  associatedDimension: null,
  criticalDimension: false,
  compensationAllowed: false,
  compensationAmount: 0,
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

export function computeBend(
  input: BendInput,
  thickness: number,
  defaults: DefaultsByThickness,
  order: number,
): BendOutput {
  const t = thickness;
  const R = input.innerRadius ?? defaults.innerRadius;
  const K = input.kFactor ?? defaults.kFactor;
  const angleRad = (Math.PI / 180) * input.angle;
  const bendAllowance = angleRad * (R + K * t);
  // Outside setback: OSSB = tan(angle/2) * (R + t)
  const outsideSetback = Math.tan((Math.PI / 180) * (input.angle / 2)) * (R + t);
  const bendDeduction = 2 * outsideSetback - bendAllowance;

  return {
    order,
    angle: input.angle,
    distanceFromPrevious: input.distance,
    innerRadius: round(R),
    kFactor: round(K, 3),
    direction: input.direction ?? 1,
    tolerance: input.tolerance ?? 0.1,
    bendAllowance: round(bendAllowance),
    bendDeduction: round(bendDeduction),
    outsideSetback: round(outsideSetback),
  };
}

function round(v: number, d = 2) {
  const f = Math.pow(10, d);
  return Math.round(v * f) / f;
}
