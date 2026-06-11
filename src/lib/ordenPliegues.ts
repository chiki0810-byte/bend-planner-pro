// ---------------------------------------------------------
// MÓDULO 19 — ORDEN DE PLIEGUES INDUSTRIAL
// ---------------------------------------------------------
// Recibe una lista de pliegues y devuelve:
// - Orden óptimo
// - Detección de colisiones
// - Fuerza total
// - Tiempo estimado
// - Secuencia paso a paso
// ---------------------------------------------------------

import type { Pieza, Pliegue } from "./uiIndustrial";

// ---------------------------------------------------------
// 19.1 — TIPOS
// ---------------------------------------------------------

export interface PasoOrden {
  paso: number;
  angulo: number;
  longitud: number;
  direccion: "interna" | "externa";
}

export interface ResultadoOrdenPliegues {
  orden: Pliegue[];
  colisiones: boolean;
  fuerzaTotal: number;
  tiempo: number;
  pasos: PasoOrden[];
}

// ---------------------------------------------------------
// 19.2 — FUNCIÓN PRINCIPAL
// ---------------------------------------------------------

export function calcularOrdenPliegues(pieza: Pieza): ResultadoOrdenPliegues {
  if (!pieza.pliegues || pieza.pliegues.length === 0) {
    return {
      orden: [],
      colisiones: false,
      fuerzaTotal: 0,
      tiempo: 0,
      pasos: [],
    };
  }

  // 19.2.1 — ORDEN BÁSICO (de menor a mayor longitud)
  const orden = [...pieza.pliegues].sort((a, b) => a.longitud - b.longitud);

  // 19.2.2 — DETECCIÓN DE COLISIONES (simplificada)
  let colisiones = false;

  for (let i = 0; i < orden.length - 1; i++) {
    const p1 = orden[i];
    const p2 = orden[i + 1];

    // Regla simple: si dos pliegues consecutivos superan 120° → posible choque
    if (p1.angulo > 120 && p2.angulo > 120) {
      colisiones = true;
    }
  }

  // 19.2.3 — FUERZA TOTAL (Toneladas)
  const fuerzaTotal = orden.reduce((acc, p) => {
    const fuerza = p.longitud * pieza.espesor * 0.0025;
    return acc + fuerza;
  }, 0);

  // 19.2.4 — TIEMPO ESTIMADO (segundos)
  const tiempo = orden.length * 3.5; // 3.5 s por pliegue

  // 19.2.5 — SECUENCIA PASO A PASO
  const pasos: PasoOrden[] = orden.map((p, index) => ({
    paso: index + 1,
    angulo: p.angulo,
    longitud: p.longitud,
    direccion: "interna",
  }));

  return {
    orden,
    colisiones,
    fuerzaTotal: Math.round(fuerzaTotal * 100) / 100,
    tiempo,
    pasos,
  };
}

// ---------------------------------------------------------
// 19.3 — HELPERS
// ---------------------------------------------------------

export function formatearTiempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = Math.round(segundos % 60);
  if (m > 0) return `${m} min ${s} s`;
  return `${s} s`;
}

export function formatearFuerza(toneladas: number): string {
  return `${toneladas.toFixed(2)} Tn`;
}
