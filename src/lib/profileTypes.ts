export type DimensionReference = "outside" | "inside" | "tangent";

export interface MaterialProperties {
  material: string;
  thickness: number;
  kFactor: number;
}

export interface Segment {
  id: string;
  dimension: number;
  dimensionReference: DimensionReference;
  leftBendId?: string;
  rightBendId?: string;
}

export interface Bend {
  id: string;
  angleDegrees: number;
  radius: number;
  kFactor: number;
  thickness: number;
  orientation: "up" | "down";
  leftSegmentId: string;
  rightSegmentId: string;
}

export interface Profile {
  id: string;
  segments: Segment[];
  bends: Bend[];
  material: MaterialProperties;
}

export interface SegmentInput {
  id: string;
  dimension: number;
  dimensionReference: DimensionReference;
}

export interface BendInput {
  id: string;
  angleInterior?: number;
  angleDegrees?: number;
  radius: number;
  kFactor?: number;
  thickness?: number;
  orientation: "up" | "down";
  leftSegmentId: string;
  rightSegmentId: string;
}

export interface FlatPatternResult {
  profileId: string;
  segments: Array<{
    id: string;
    inputDimension: number;
    reference: DimensionReference;
    geometricCorrection: number;
    flatLength: number;
  }>;
  bends: Array<{
    id: string;
    angle: number;
    BA: number;
    OSSB: number;
    ISSB: number;
    BD: number;
  }>;
  totalFlatLength: number;
  calculationLog: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
