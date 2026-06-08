// ---------------------------------------------------------
// MÓDULO 11 — SIMULADOR DE PLEGADO PASO A PASO
// ---------------------------------------------------------
// Este módulo genera una simulación completa del proceso:
// - Estado tras cada pliegue
// - Avisos por paso
// - Detección de atrapamiento en tiempo real
// - Detección de accesibilidad por paso
// - Detección de giros necesarios
// ---------------------------------------------------------

import type { Pieza, Pliegue } from "./logicaPliegues";
import { validarPiezaCompleta } from "./logicaPliegues";
import {
  validarAccesibilidad,
  calcularGiros,
  ordenarIA,
} from "./ordenPlegado";

export interface PasoSimulacion {
  paso: number;
  pliegue: Pliegue;
  descripcion: string;
  avisos: string[];
}

export interface SimulacionPlegado {
  pieza: Pieza;
  pasos: PasoSimulacion[];
  avisosGlobales: string[];
}

// ---------------------------------------------------------
// 11.1 — GENERAR SIMULACIÓN COMPLETA
// ---------------------------------------------------------

export function simularPlegado(pieza: Pieza): SimulacionPlegado {
  const pasos: PasoSimulacion[] = [];

  // Orden sugerido por IA (puedes cambiar a A/B si quieres)
  const secuencia = ordenarIA(pieza);

  // Avisos globales (antes de empezar)
  const avisosGlobales = [
    ...validarPiezaCompleta(pieza),
    ...validarAccesibilidad(pieza),
    ...calcularGiros(pieza),
  ];

  // Simulación paso a paso
  secuencia.forEach((pliegue, index) => {
    const avisosPaso: string[] = [];

    // Aviso si el pliegue es crítico
    if (pliegue.critico) {
      avisosPaso.push(
        `⚠️ El pliegue "${pliegue.id}" es crítico (ala pequeña o ángulo cerrado).`
      );
    }

    // Aviso si es cierre
    if (pliegue.cierra) {
      avisosPaso.push(`🔒 El pliegue "${pliegue.id}" CIERRA la pieza.`);
    }

    // Aviso si requiere giro
    if (pliegue.longitud < 20) {
      avisosPaso.push(`↪️ Requiere "toda la chapa fuera".`);
    } else if (pliegue.longitud > 80) {
      avisosPaso.push(`↩️ Requiere giro hacia adelante.`);
    }

    // Aviso si el cierre atraparía chapas
    if (pliegue.cierra && pliegue.modoChapas !== "simple") {
      avisosPaso.push(
        `❌ Este cierre atrapará las chapas si se hace en ${pliegue.modoChapas}.`
      );
    }

    pasos.push({
      paso: index + 1,
      pliegue,
      descripcion: `Aplicando pliegue ${pliegue.id} (${pliegue.longitud} mm @ ${pliegue.angulo}°)`,
      avisos: avisosPaso,
    });
  });

  return {
    pieza,
    pasos,
    avisosGlobales,
  };
}

// ---------------------------------------------------------
// 11.2 — EJEMPLO DE USO (puedes borrar)
// ---------------------------------------------------------

/*
import { simularPlegado } from "./simuladorPlegado";
const resultado = simularPlegado(piezaEjemplo);
console.log(resultado);
*/
