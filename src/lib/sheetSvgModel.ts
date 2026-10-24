export interface Fold {
  id: string;
  x: number;
  angle: number;
}

export interface CutRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CutPath {
  id: string;
  points: { x: number; y: number }[];
}

export type Cut = CutRect | CutPath;

export interface BendZone {
  id: string;
  x: number;
  width: number;
  color?: string;
}

export interface Dim {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

export interface SheetState {
  base: { W: number; H: number; stroke: number };
  bendZones: BendZone[];
  cuts: Cut[];
  folds: Fold[];
  dims: Dim[];
}

export const defaultSheetState: SheetState = {
  base: { W: 500, H: 300, stroke: 1.5 },
  bendZones: [],
  cuts: [],
  folds: [],
  dims: [],
};

export function buildCutPathD(points: { x: number; y: number }[]): string {
  if (!points || points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
}
