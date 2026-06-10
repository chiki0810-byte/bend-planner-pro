// ---------------------------------------------------------
// MÓDULO 18 — CÁLCULO DE DESARROLLO (LONGITUD PLANA)
// ---------------------------------------------------------
// Cálculo industrial simple y estable del desarrollo de la pieza.
// No depende de UI. No usa campos inventados.
// ---------------------------------------------------------

import type { Pieza, Pliegue } from "./uiIndustrial";

// ---------------------------------------------------------
// 18.1 — FUNCIÓN PRINCIPAL
// ---------------------------------------------------------

export function calcularDesarrollo(pieza: Pieza): number {
  if (!pieza.pliegues || pieza.pliegues.length === 0) return 0;

  const K = 0.33; // Factor industrial estándar

  let desarrollo = 0;

  for (const p of pieza.pliegues) {
    // Longitud directa
    desarrollo += p.longitud;

    // Aporte del pliegue (bend allowance simplificada)
    const anguloRad = (p.angulo * Math.PI) / 180;
    desarrollo += K * pieza.espesor * anguloRad;
  }

  return Math.round(desarrollo);
}

// ---------------------------------------------------------
// 18.2 — VARIANTE POR PLIEGUE (para desglose)
// ---------------------------------------------------------

export interface DetalleDesarrolloPliegue {
  id: string;
  longitudPlana: number;
  aporteBendAllowance: number;
  subtotal: number;
}

export function calcularDesarrolloDetallado(pieza: Pieza): {
  detalles: DetalleDesarrolloPliegue[];
  total: number;
} {
  if (!pieza.pliegues || pieza.pliegues.length === 0) {
    return { detalles: [], total: 0 };
  }

  const K = 0.33;
  const detalles: DetalleDesarrolloPliegue[] = [];

  for (const p of pieza.pliegues) {
    const anguloRad = (p.angulo * Math.PI) / 180;
    const aporte = K * pieza.espesor * anguloRad;
    detalles.push({
      id: p.id,
      longitudPlana: p.longitud,
      aporteBendAllowance: aporte,
      subtotal: p.longitud + aporte,
    });
  }

  const total = Math.round(detalles.reduce((s, d) => s + d.subtotal, 0));
  return { detalles, total };
}

// ---------------------------------------------------------
// 18.3 — HELPERS
// ---------------------------------------------------------

export function desarrolloConMargen(
  pieza: Pieza,
  margenMm: number = 5
): number {
  const base = calcularDesarrollo(pieza);
  return base + margenMm * 2; // margen a cada lado
}
