// ---------------------------------------------------------
// MÓDULO 12 — UI INDUSTRIAL BÁSICA (LISTO PARA LOVABLE)
// ---------------------------------------------------------
// Define tipos, estado y acciones mínimas para la pantalla
// industrial que muestra piezas, pliegues y resultados.
// ---------------------------------------------------------

export interface Pliegue {
  id: string;
  longitud: number; // mm
  angulo: number;   // grados
}

export interface Pieza {
  id: string;
  nombre: string;
  espesor: number; // mm
  color?: string;
  pliegues: Pliegue[];
}

export interface ResultadoIndustrial {
  tipoPieza: string;
  tieneAlaMachacada: boolean;
  modoTrabajo: "individual" | "doble" | "no_recomendado";
  maquinaRecomendada: string;
  maquinasValidas: string[];
  maquinasInvalidas: string[];
  avisos: string[];
  desarrolloAproximado?: number; // mm
  ordenPliegues: string[];       // ids de pliegues en orden
}

// ---------------------------------------------------------
// 12.1 — ESTADO BÁSICO DE LA PANTALLA
// ---------------------------------------------------------

export interface EstadoUIIndustrial {
  piezaActual: Pieza | null;
  resultado: ResultadoIndustrial | null;
  cargando: boolean;
  error?: string;
}

export const estadoInicialUIIndustrial: EstadoUIIndustrial = {
  piezaActual: null,
  resultado: null,
  cargando: false,
  error: undefined,
};

// ---------------------------------------------------------
// 12.2 — ACCIONES PRINCIPALES DE LA PANTALLA
// ---------------------------------------------------------

export function setPiezaActual(
  estado: EstadoUIIndustrial,
  pieza: Pieza
): EstadoUIIndustrial {
  return {
    ...estado,
    piezaActual: pieza,
    resultado: null,
    error: undefined,
  };
}

export function setResultado(
  estado: EstadoUIIndustrial,
  resultado: ResultadoIndustrial
): EstadoUIIndustrial {
  return {
    ...estado,
    resultado,
    cargando: false,
    error: undefined,
  };
}

export function setCargando(
  estado: EstadoUIIndustrial,
  cargando: boolean
): EstadoUIIndustrial {
  return { ...estado, cargando };
}

export function setError(
  estado: EstadoUIIndustrial,
  error: string
): EstadoUIIndustrial {
  return { ...estado, error, cargando: false };
}

export function limpiarUI(): EstadoUIIndustrial {
  return { ...estadoInicialUIIndustrial };
}

// ---------------------------------------------------------
// 12.3 — HELPERS DE PRESENTACIÓN
// ---------------------------------------------------------

export function formatearModoTrabajo(
  modo: ResultadoIndustrial["modoTrabajo"]
): string {
  switch (modo) {
    case "individual":
      return "Trabajo individual";
    case "doble":
      return "Doble chapa";
    case "no_recomendado":
      return "⚠️ No recomendado";
  }
}

export function resumenPieza(pieza: Pieza | null): string {
  if (!pieza) return "Sin pieza cargada";
  return `${pieza.nombre} · ${pieza.espesor} mm · ${pieza.pliegues.length} pliegues`;
}
