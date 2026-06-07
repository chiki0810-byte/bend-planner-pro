// ------------------------------
// MÓDULO 8 — LÓGICA DE PLIEGUES
// ------------------------------
// Tipos de pieza: remate, canal, cumbrera, otro
// Reglas de atrapamiento y cierre
// Pliegues con metadatos industriales reales
// ------------------------------

export type TipoPieza = "remate" | "canal" | "cumbrera" | "otro";

export interface Pliegue {
  id: string;
  longitud: number;
  angulo: number;
  cierra: boolean;            // true = pliegue que cierra la pieza
  critico: boolean;           // alas pequeñas o ángulos muy cerrados
  modoChapas: "simple" | "doble" | "triple"; // cómo se puede plegar
}

export interface Pieza {
  id: string;
  nombre: string;
  tipoPieza: TipoPieza;
  pliegues: Pliegue[];
}

// ------------------------------
// REGLA 1 — DETECTAR ATRAPAMIENTO
// ------------------------------
// Si la pieza es un canal y el pliegue que cierra se hace en doble/triple,
// la pieza queda atrapada y no se pueden separar las chapas.

export function validarAtrapamiento(pieza: Pieza): string[] {
  const avisos: string[] = [];

  const pliegueCierre = pieza.pliegues.find((p) => p.cierra === true);
  if (!pliegueCierre) return avisos;

  if (pieza.tipoPieza === "canal" && pliegueCierre.modoChapas !== "simple") {
    avisos.push(
      `⚠️ El pliegue "${pliegueCierre.id}" CIERRA la pieza. ` +
        `Si lo haces en ${pliegueCierre.modoChapas}, las chapas quedarán atrapadas. ` +
        `Debes separar antes del cierre.`,
    );
  }

  return avisos;
}

// ------------------------------
// REGLA 2 — PERMITIR DOBLE/TRIPLE
// ------------------------------
// Remates y cumbreras permiten plegado doble/triple hasta el final.

export function validarModoChapas(pieza: Pieza): string[] {
  const avisos: string[] = [];

  pieza.pliegues.forEach((p) => {
    if (pieza.tipoPieza === "remate" || pieza.tipoPieza === "cumbrera") {
      // Todo permitido, no avisamos
      return;
    }

    // En otros tipos, avisamos si un pliegue crítico se intenta en doble/triple
    if (p.critico && p.modoChapas !== "simple") {
      avisos.push(
        `⚠️ El pliegue "${p.id}" es crítico (ala pequeña o ángulo cerrado). ` +
          `No se recomienda hacerlo en ${p.modoChapas}.`,
      );
    }
  });

  return avisos;
}

// ------------------------------
// VALIDACIÓN COMPLETA DE LA PIEZA
// ------------------------------
// Combina todas las reglas y devuelve la lista de avisos industriales.

export function validarPiezaCompleta(pieza: Pieza): string[] {
  return [...validarAtrapamiento(pieza), ...validarModoChapas(pieza)];
}
