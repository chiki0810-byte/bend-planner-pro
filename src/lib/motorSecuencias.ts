// ---------------------------------------------------------
// MÓDULO 10 — MOTOR DE SECUENCIAS COMPLETAS
// ---------------------------------------------------------
// Integra:
// - Módulo 8 (lógica de pliegues, atrapamiento)
// - Módulo 9 (orden IA, orden operario, accesibilidad, giros)
// Devuelve:
// - Secuencia IA
// - Secuencia Operario A
// - Secuencia Operario B
// - Avisos combinados
// ---------------------------------------------------------

import type { Pieza, Pliegue } from "./logicaPliegues";
import { validarPiezaCompleta } from "./logicaPliegues";
import {
  ordenarIA,
  ordenarOperario,
  validarAccesibilidad,
  calcularGiros,
} from "./ordenPlegado";

export interface SecuenciaPlegado {
  modo: "IA" | "OPERARIO_A" | "OPERARIO_B";
  descripcion: string;
  pliegues: Pliegue[];
}

export interface ResultadoPlegado {
  pieza: Pieza;
  secuencias: SecuenciaPlegado[];
  avisos: string[];
}

// ---------------------------------------------------------
// 10.1 — GENERAR SECUENCIAS
// ---------------------------------------------------------

function generarSecuencias(pieza: Pieza): SecuenciaPlegado[] {
  const secuenciaIA: SecuenciaPlegado = {
    modo: "IA",
    descripcion: "Orden sugerido por la lógica estándar (IA).",
    pliegues: ordenarIA(pieza),
  };

  const secuenciaOperarioA: SecuenciaPlegado = {
    modo: "OPERARIO_A",
    descripcion: "Orden A — Asentar primero (pliegues grandes antes).",
    pliegues: ordenarOperario(pieza, "A"),
  };

  const secuenciaOperarioB: SecuenciaPlegado = {
    modo: "OPERARIO_B",
    descripcion: "Orden B — Precisión en pequeños (pliegues pequeños antes).",
    pliegues: ordenarOperario(pieza, "B"),
  };

  return [secuenciaIA, secuenciaOperarioA, secuenciaOperarioB];
}

// ---------------------------------------------------------
// 10.2 — COMBINAR AVISOS
// ---------------------------------------------------------

function combinarAvisos(pieza: Pieza): string[] {
  const avisosLogica = validarPiezaCompleta(pieza); // Módulo 8
  const avisosAccesibilidad = validarAccesibilidad(pieza); // Módulo 9
  const avisosGiros = calcularGiros(pieza); // Módulo 9

  const todos = [...avisosLogica, ...avisosAccesibilidad, ...avisosGiros];

  // Eliminar duplicados
  return Array.from(new Set(todos));
}

// ---------------------------------------------------------
// 10.3 — FUNCIÓN PRINCIPAL DEL MÓDULO 10
// ---------------------------------------------------------

export function generarResultadoPlegado(pieza: Pieza): ResultadoPlegado {
  const secuencias = generarSecuencias(pieza);
  const avisos = combinarAvisos(pieza);

  return {
    pieza,
    secuencias,
    avisos,
  };
}

// ---------------------------------------------------------
// 10.4 — EJEMPLO DE USO (puedes borrar)
// ---------------------------------------------------------

/*
import { generarResultadoPlegado } from "./motorSecuencias";
import { piezaEjemplo } from "./ejemplos"; // si tienes ejemplos separados

const resultado = generarResultadoPlegado(piezaEjemplo);

console.log("Secuencias:", resultado.secuencias);
console.log("Avisos:", resultado.avisos);
*/
