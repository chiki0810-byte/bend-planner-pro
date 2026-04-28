// Validación de plegado contra máquinas reales del taller.
// Define las 3 máquinas y aplica las reglas concretas que cada una impone
// sobre el desarrollo de la pieza calculado en BendCalculator.

import { BendResult } from "@/pages/Index";
import { BendItemValue } from "@/components/BendItem";

export type MachineId = "stefa8" | "jordi6" | "prensa6";

export interface MachineSpec {
  id: MachineId;
  name: string;
  short: string;
  type: "folder" | "press";
  maxLength: number;            // longitud máxima de plegado (mm)
  maxBackgauge?: number;        // tope trasero (mm) — solo prensas
  maxFlangeHeight: number;      // apertura máx / altura de ala segura (mm)
  goosenecK?: number;           // cuello de cisne (mm) — solo prensas
  maxAngle: number;             // ángulo máximo de plegado (°)
  allowDown: boolean;           // permite pliegues hacia abajo
  allowDeepBox: boolean;        // permite cajas profundas / geometrías cerradas
  tonnage?: number;             // toneladas (prensas)
  maxThickness: Record<string, number>; // por material
  recommendedSequence: "outside-in" | "inside-out";
}

export const MACHINES: MachineSpec[] = [
  {
    id: "stefa8",
    name: "Plegadora de Bandeja STEFA VH (8 m)",
    short: "Stefa 8 m",
    type: "folder",
    maxLength: 8040,
    maxFlangeHeight: 260,
    maxAngle: 145,
    allowDown: false,
    allowDeepBox: false,
    maxThickness: { "Acero St40": 3, "Acero": 3, "Aluminio": 4, "Inox": 2 },
    recommendedSequence: "outside-in",
  },
  {
    id: "jordi6",
    name: "Prensa Hidráulica JORDI PH6100-180 (6 m, 180 t)",
    short: "Jordi 6 m · 180 t",
    type: "press",
    maxLength: 6000,
    maxBackgauge: 950,
    maxFlangeHeight: 525, // apertura mesa-trancha mínima
    goosenecK: 410,
    maxAngle: 180,
    allowDown: true,
    allowDeepBox: true,
    tonnage: 180,
    maxThickness: { "Acero St40": 8, "Acero": 8, "Aluminio": 10, "Inox": 6 },
    recommendedSequence: "inside-out",
  },
  {
    id: "prensa6",
    name: "Prensa Hidráulica 6 m (tope 950 mm)",
    short: "Prensa 6 m",
    type: "press",
    maxLength: 6000,
    maxBackgauge: 950,
    maxFlangeHeight: 525,
    goosenecK: 410,
    maxAngle: 180,
    allowDown: true,
    allowDeepBox: true,
    tonnage: 100, // genérica, ajustable
    maxThickness: { "Acero St40": 6, "Acero": 6, "Aluminio": 8, "Inox": 4 },
    recommendedSequence: "inside-out",
  },
];

export type IssueLevel = "error" | "warn" | "info";

export interface ValidationIssue {
  level: IssueLevel;
  code: string;
  message: string;
  bendOrder?: number;
}

export interface SequenceStep {
  order: number;          // orden en la secuencia recomendada
  bendOrder: number;      // nº de pliegue original
  angle: number;
  direction: 1 | -1;
  distance: number;       // distancia desde borde / pliegue previo
  note?: string;
}

export interface MachineValidation {
  machine: MachineSpec;
  status: "ok" | "warning" | "blocked";
  issues: ValidationIssue[];
  sequence: SequenceStep[];
}

export interface ValidationInput {
  machineId: MachineId;
  result: BendResult;
  bends: BendItemValue[];
  material: string;
  thickness: number;
  pieceWidth?: number; // ancho del plegado (mm), si no se da se asume = largo
}

// Calcula la "altura de ala" de cada pliegue: distancia entre ese pliegue
// y el siguiente (o el borde final). Es lo que sube físicamente.
function flangeHeights(input: ValidationInput): number[] {
  const dists = input.result.bends.map(b => b.distanceFromPrevious);
  const total = input.result.pieceLength;
  // posiciones acumuladas de cada pliegue desde el borde inicial
  const positions: number[] = [];
  let acc = 0;
  for (const d of dists) { acc += d; positions.push(acc); }
  const heights: number[] = [];
  for (let i = 0; i < positions.length; i++) {
    const next = i < positions.length - 1 ? positions[i + 1] : total;
    heights.push(Number((next - positions[i]).toFixed(2)));
  }
  return heights;
}

// Detecta si la pieza forma una geometría cerrada / caja profunda:
// si la suma de pliegues en un mismo sentido supera ~270° hay riesgo de cierre.
function detectClosedGeometry(bends: BendItemValue[]): boolean {
  const sumUp = bends.filter(b => b.direction === 1).reduce((s, b) => s + b.angle, 0);
  const sumDown = bends.filter(b => b.direction === -1).reduce((s, b) => s + b.angle, 0);
  return sumUp >= 270 || sumDown >= 270;
}

// Tonelaje aproximado requerido (regla del aire):
// F (t/m) ≈ 1.42 * Rm * t² / V    con V = 8*t (matriz típica)
// Rm acero ≈ 45 kg/mm². Devuelve toneladas para el ancho dado (m).
function requiredTonnage(thickness: number, widthMm: number, material: string): number {
  const Rm = material.toLowerCase().includes("inox") ? 65
    : material.toLowerCase().includes("alum") ? 25 : 45;
  const V = 8 * thickness;
  const tPerMeter = (1.42 * Rm * thickness * thickness) / V;
  return Number(((tPerMeter * widthMm) / 1000).toFixed(1));
}

export function validateOnMachine(input: ValidationInput): MachineValidation {
  const m = MACHINES.find(x => x.id === input.machineId)!;
  const issues: ValidationIssue[] = [];
  const heights = flangeHeights(input);
  const width = input.pieceWidth ?? input.result.pieceLength;

  // 1. Largo total
  if (input.result.pieceLength > m.maxLength) {
    issues.push({
      level: "error", code: "LENGTH",
      message: `Largo de pieza ${input.result.pieceLength} mm supera el máximo de ${m.maxLength} mm.`,
    });
  }

  // 2. Espesor por material
  const matKey = Object.keys(m.maxThickness).find(k =>
    input.material.toLowerCase().includes(k.toLowerCase().split(" ")[0])
  );
  const tMax = matKey ? m.maxThickness[matKey] : undefined;
  if (tMax && input.thickness > tMax) {
    issues.push({
      level: "error", code: "THICKNESS",
      message: `Espesor ${input.thickness} mm supera el máximo (${tMax} mm) para ${input.material}.`,
    });
  } else if (!tMax) {
    issues.push({
      level: "warn", code: "MATERIAL",
      message: `Material "${input.material}" no está en la tabla de la máquina; revisa límites manualmente.`,
    });
  }

  // 3. Pliegues individuales
  input.result.bends.forEach((b, i) => {
    const h = heights[i];

    // Ángulo máximo
    if (b.angle > m.maxAngle) {
      issues.push({
        level: "error", code: "ANGLE", bendOrder: b.order,
        message: `Pliegue ${b.order}: ángulo ${b.angle}° supera el máximo de ${m.maxAngle}°.`,
      });
    }

    // Sentido (Stefa solo arriba)
    if (b.direction === -1 && !m.allowDown) {
      issues.push({
        level: "error", code: "DIRECTION", bendOrder: b.order,
        message: `Pliegue ${b.order}: ${m.short} solo permite pliegues hacia arriba.`,
      });
    }

    // Altura de ala
    if (h > m.maxFlangeHeight) {
      issues.push({
        level: "error", code: "FLANGE", bendOrder: b.order,
        message: `Pliegue ${b.order}: altura de ala ${h} mm supera la apertura útil (${m.maxFlangeHeight} mm).`,
      });
    } else if (m.goosenecK && h > m.goosenecK) {
      issues.push({
        level: "warn", code: "GOOSENECK", bendOrder: b.order,
        message: `Pliegue ${b.order}: altura de ala ${h} mm supera el cuello de cisne (${m.goosenecK} mm). Riesgo de choque con punzón.`,
      });
    }

    // Tope trasero (prensas)
    if (m.maxBackgauge && b.distanceFromPrevious > m.maxBackgauge) {
      issues.push({
        level: "error", code: "BACKGAUGE", bendOrder: b.order,
        message: `Pliegue ${b.order}: distancia ${b.distanceFromPrevious} mm supera el tope trasero (${m.maxBackgauge} mm).`,
      });
    }

    // Choque por ala alta + pliegue contrario previo (prensas)
    if (m.type === "press" && i > 0) {
      const prev = input.result.bends[i - 1];
      if (prev.direction !== b.direction && heights[i - 1] > m.maxFlangeHeight * 0.8) {
        issues.push({
          level: "warn", code: "COLLISION", bendOrder: b.order,
          message: `Pliegue ${b.order}: posible choque con ala previa (${heights[i - 1]} mm en sentido opuesto).`,
        });
      }
    }

    // Stefa: choque de alas con bandeja al levantar (alas previas altas)
    if (m.type === "folder" && i > 0 && heights[i - 1] > 80) {
      issues.push({
        level: "warn", code: "TRAY_COLLISION", bendOrder: b.order,
        message: `Pliegue ${b.order}: el ala anterior (${heights[i - 1]} mm) puede chocar con la bandeja al levantar.`,
      });
    }
  });

  // 4. Geometría cerrada / caja profunda
  if (detectClosedGeometry(input.bends) && !m.allowDeepBox) {
    issues.push({
      level: "error", code: "CLOSED_GEOMETRY",
      message: `${m.short} no permite cajas profundas ni geometrías cerradas (suma de pliegues ≥ 270° en un sentido).`,
    });
  } else if (detectClosedGeometry(input.bends)) {
    issues.push({
      level: "warn", code: "DEEP_BOX",
      message: `Geometría con caja profunda detectada: verifica que la pieza no se encierre sobre el punzón.`,
    });
  }

  // 5. Tonelaje (prensas)
  if (m.type === "press" && m.tonnage) {
    const req = requiredTonnage(input.thickness, width, input.material);
    if (req > m.tonnage) {
      issues.push({
        level: "error", code: "TONNAGE",
        message: `Tonelaje requerido ≈ ${req} t supera las ${m.tonnage} t de la máquina.`,
      });
    } else if (req > m.tonnage * 0.85) {
      issues.push({
        level: "warn", code: "TONNAGE_HIGH",
        message: `Tonelaje requerido ≈ ${req} t cerca del límite (${m.tonnage} t).`,
      });
    } else {
      issues.push({
        level: "info", code: "TONNAGE_OK",
        message: `Tonelaje requerido ≈ ${req} t (máquina: ${m.tonnage} t).`,
      });
    }
  }

  // 6. Secuencia recomendada
  const indexed = input.result.bends.map((b, i) => ({ b, h: heights[i] }));
  const sorted = m.recommendedSequence === "outside-in"
    // exteriores primero: alas más cortas (extremos) primero
    ? [...indexed].sort((a, z) => a.h - z.h)
    // interiores primero: pliegues centrales (alas mayores) primero
    : [...indexed].sort((a, z) => z.h - a.h);

  const sequence: SequenceStep[] = sorted.map((s, idx) => ({
    order: idx + 1,
    bendOrder: s.b.order,
    angle: s.b.angle,
    direction: s.b.direction,
    distance: s.b.distanceFromPrevious,
    note: idx === 0
      ? (m.recommendedSequence === "outside-in" ? "Empezar por el ala más corta (exterior)" : "Empezar por el pliegue interior")
      : undefined,
  }));

  const hasError = issues.some(i => i.level === "error");
  const hasWarn = issues.some(i => i.level === "warn");
  const status: MachineValidation["status"] = hasError ? "blocked" : hasWarn ? "warning" : "ok";

  return { machine: m, status, issues, sequence };
}
