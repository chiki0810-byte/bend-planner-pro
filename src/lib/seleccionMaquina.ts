// ---------------------------------------------------------
// MÓDULO 15 — SELECCIÓN AUTOMÁTICA DE MÁQUINA
// ---------------------------------------------------------
// Este módulo analiza la pieza y determina qué máquinas del
// taller pueden realizarla, cuáles no, y cuál es la recomendada.
// ---------------------------------------------------------

import type { Pieza } from "./uiIndustrial";
import { maquinasTaller } from "./motorMaquinas";

// ---------------------------------------------------------
// 15.1 — TIPOS DE RESULTADO
// ---------------------------------------------------------

export interface ResultadoSeleccionMaquina {
  maquinaRecomendada: string;
  maquinasValidas: string[];
  maquinasInvalidas: string[];
  avisos: string[];
}

// ---------------------------------------------------------
// 15.2 — DETECCIÓN DE ALA MACHACADA (helper local)
// ---------------------------------------------------------
// Se considera "ala machacada" cuando al menos un pliegue
// tiene una longitud menor a 10 mm, lo que requiere
// machacado para realizar el plegado correctamente.
// TODO: mover a Módulo 16 cuando esté disponible.

function detectarAlaMachacada(pieza: Pieza): boolean {
  const UMBRAL_ALA_MACHACADA = 10; // mm
  return pieza.pliegues.some(p => p.longitud < UMBRAL_ALA_MACHACADA);
}

// ---------------------------------------------------------
// 15.3 — FUNCIÓN PRINCIPAL
// ---------------------------------------------------------

export function seleccionarMaquina(pieza: Pieza): ResultadoSeleccionMaquina {
  const avisos: string[] = [];
  const validas: string[] = [];
  const invalidas: string[] = [];

  const requiereMachacado = detectarAlaMachacada(pieza);

  // Altura máxima de pliegue (para comprobar apertura)
  const alturaMax = Math.max(...pieza.pliegues.map(p => p.longitud));

  // Longitud total aproximada de la pieza (suma de pliegues)
  const longitudTotal = pieza.pliegues.reduce((acc, p) => acc + p.longitud, 0);

  for (const m of maquinasTaller) {
    let esValida = true;

    // 1) Requiere machacado
    if (requiereMachacado && !m.puedeMachacar) {
      esValida = false;
      avisos.push(`⚠️ ${m.nombre} no puede machacar alas pequeñas.`);
    }

    // 2) Apertura insuficiente
    if (alturaMax > m.apertura) {
      esValida = false;
      avisos.push(
        `⚠️ ${m.nombre}: altura de ala ${alturaMax} mm supera la apertura (${m.apertura} mm).`
      );
    }

    // 3) Espesor excedido
    if (pieza.espesor > m.espesorMax) {
      esValida = false;
      avisos.push(
        `⚠️ ${m.nombre}: espesor ${pieza.espesor} mm supera el máximo (${m.espesorMax} mm).`
      );
    }

    // 4) Longitud útil insuficiente
    if (longitudTotal > m.longitudUtil) {
      esValida = false;
      avisos.push(
        `⚠️ ${m.nombre}: longitud de pieza ${longitudTotal} mm supera la longitud útil (${m.longitudUtil} mm).`
      );
    }

    if (esValida) {
      validas.push(m.nombre);
    } else {
      invalidas.push(m.nombre);
    }
  }

  // ---------------------------------------------------------
  // 15.4 — RECOMENDACIÓN
  // ---------------------------------------------------------
  // Se recomienda la máquina más pequeña que pueda realizar
  // el trabajo (más eficiente energéticamente y de setup).
  // Orden de preferencia: long_folder → hidraulica_ligera
  // → hidraulica_media → hidraulica_pesada

  const prioridadCategoria: Record<string, number> = {
    manual: 0,
    paneladora: 1,
    long_folder: 2,
    hidraulica_ligera: 3,
    hidraulica_media: 4,
    hidraulica_pesada: 5,
  };

  let maquinaRecomendada = "Ninguna máquina puede realizar esta pieza";

  if (validas.length > 0) {
    const maquinasValidasOrdenadas = maquinasTaller
      .filter(m => validas.includes(m.nombre))
      .sort((a, b) => {
        const prioA = prioridadCategoria[a.categoria] ?? 99;
        const prioB = prioridadCategoria[b.categoria] ?? 99;
        return prioA - prioB;
      });

    maquinaRecomendada = maquinasValidasOrdenadas[0].nombre;

    avisos.push(
      `✅ Recomendada: ${maquinaRecomendada} (categoría: ${maquinasValidasOrdenadas[0].categoria}).`
    );
  } else {
    avisos.push(`❌ Ninguna máquina del taller puede realizar esta pieza.`);
  }

  return {
    maquinaRecomendada,
    maquinasValidas: validas,
    maquinasInvalidas: invalidas,
    avisos,
  };
}

// ---------------------------------------------------------
// 15.5 — EJEMPLO DE USO (puedes borrar)
// ---------------------------------------------------------

/*
import { seleccionarMaquina } from "./seleccionMaquina";
import type { Pieza } from "./uiIndustrial";

const piezaEjemplo: Pieza = {
  id: "p-001",
  nombre: "Pieza de prueba",
  espesor: 1.5,
  pliegues: [
    { id: "b1", longitud: 50, angulo: 90 },
    { id: "b2", longitud: 100, angulo: 90 },
    { id: "b3", longitud: 50, angulo: 90 }
  ]
};

const resultado = seleccionarMaquina(piezaEjemplo);
console.log("Recomendada:", resultado.maquinaRecomendada);
console.log("Válidas:", resultado.maquinasValidas);
console.log("Inválidas:", resultado.maquinasInvalidas);
console.log("Avisos:", resultado.avisos);
*/
