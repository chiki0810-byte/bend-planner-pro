// ---------------------------------------------------------
// MÓDULO 17 — MOTOR INDUSTRIAL COMPLETO
// ---------------------------------------------------------
// Une validación (13), reglas industriales (16) y selección
// automática de máquina (15) en un único flujo industrial.
// ---------------------------------------------------------

import type { Pieza } from "./uiIndustrial";
import { validarPieza } from "./motorValidacion";
import { analizarProcesoIndustrial } from "./reglasProceso";
import { seleccionarMaquina } from "./seleccionMaquina";

// ---------------------------------------------------------
// 17.1 — TIPO DE RESULTADO FINAL
// ---------------------------------------------------------

export interface ResultadoIndustrialCompleto {
  valido: boolean;
  errores: string[];
  advertencias: string[];
  tipoPieza: string;
  tieneAlaMachacada: boolean;
  modoTrabajo: string;
  avisos: string[];
  maquinaRecomendada: string;
  maquinasValidas: string[];
  maquinasInvalidas: string[];
}

// ---------------------------------------------------------
// 17.2 — FUNCIÓN PRINCIPAL
// ---------------------------------------------------------

export function procesarPiezaIndustrial(pieza: Pieza): ResultadoIndustrialCompleto {
  // 1) VALIDACIÓN (Módulo 13)
  const validacion = validarPieza(pieza);

  if (!validacion.valido) {
    return {
      valido: false,
      errores: validacion.errores,
      advertencias: validacion.advertencias,
      tipoPieza: "desconocido",
      tieneAlaMachacada: false,
      modoTrabajo: "individual",
      avisos: [],
      maquinaRecomendada: "Ninguna",
      maquinasValidas: [],
      maquinasInvalidas: []
    };
  }

  // 2) REGLAS INDUSTRIALES (Módulo 16)
  const reglas = analizarProcesoIndustrial(pieza);

  // 3) SELECCIÓN DE MÁQUINA (Módulo 15)
  const seleccion = seleccionarMaquina(pieza);

  // 4) UNIFICACIÓN DEL RESULTADO
  return {
    valido: true,
    errores: [],
    advertencias: validacion.advertencias,
    tipoPieza: reglas.tipoPieza,
    tieneAlaMachacada: reglas.tieneAlaMachacada,
    modoTrabajo: reglas.modoTrabajo,
    avisos: [...reglas.avisos, ...seleccion.avisos],
    maquinaRecomendada: seleccion.maquinaRecomendada,
    maquinasValidas: seleccion.maquinasValidas,
    maquinasInvalidas: seleccion.maquinasInvalidas
  };
}
