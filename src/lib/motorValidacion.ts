// ---------------------------------------------------------
// MÓDULO 13 — MOTOR DE VALIDACIÓN INDUSTRIAL
// ---------------------------------------------------------
// Este módulo valida que la pieza esté correctamente definida
// antes de enviarla al motor industrial (Módulo 17).
// ---------------------------------------------------------

import type { Pieza, Pliegue } from "./uiIndustrial";

export interface ResultadoValidacion {
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

// ---------------------------------------------------------
// 13.1 — VALIDACIÓN PRINCIPAL
// ---------------------------------------------------------

export function validarPieza(pieza: Pieza): ResultadoValidacion {
  const errores: string[] = [];
  const advertencias: string[] = [];

  if (!pieza) {
    errores.push("No se ha recibido ninguna pieza.");
    return { valido: false, errores, advertencias };
  }

  // Validar nombre
  if (!pieza.nombre || pieza.nombre.trim().length === 0) {
    advertencias.push("La pieza no tiene nombre asignado.");
  }

  // Validar espesor
  if (pieza.espesor <= 0) {
    errores.push("El espesor debe ser mayor que 0 mm.");
  }

  if (pieza.espesor > 5) {
    advertencias.push("Espesor inusualmente alto para plegado estándar.");
  }

  // Validar pliegues
  if (!pieza.pliegues || pieza.pliegues.length === 0) {
    errores.push("La pieza no contiene pliegues.");
  }

  pieza.pliegues.forEach((p: Pliegue, index: number) => {
    if (p.longitud <= 0) {
      errores.push(`El pliegue ${index + 1} tiene longitud inválida.`);
    }
    if (p.angulo <= 0 || p.angulo >= 180) {
      errores.push(`El pliegue ${index + 1} tiene un ángulo inválido.`);
    }
  });

  // Validar coherencia general
  const sumaLongitudes = pieza.pliegues.reduce((acc, p) => acc + p.longitud, 0);
  if (sumaLongitudes < 20) {
    advertencias.push("La pieza parece demasiado pequeña.");
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}
