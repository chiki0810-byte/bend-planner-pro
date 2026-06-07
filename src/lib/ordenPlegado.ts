// ---------------------------------------------------------
// MÓDULO 9 — ORDEN DE PLEGADO REAL (A/B) + ACCESIBILIDAD
// ---------------------------------------------------------
// Este módulo calcula:
// - Orden sugerido por la IA (seguro)
// - Orden alternativo del operario (A/B)
// - Avisos de accesibilidad (pieza no entra / ala muy pequeña)
// - Avisos por giros de chapa (frente / hacia adelante / toda fuera)
// - Avisos por pliegues imposibles según geometría
// ---------------------------------------------------------

import type { Pieza, Pliegue } from "./logicaPliegues";

// ---------------------------------------------------------
// 9.1 — ORDEN SUGERIDO POR LA IA
// ---------------------------------------------------------
// Regla general industrial:
// 1) Pliegues grandes y abiertos primero
// 2) Pliegues medianos después
// 3) Pliegues pequeños o delicados
// 4) Pliegue que CIERRA siempre al final

export function ordenarIA(pieza: Pieza): Pliegue[] {
  const pliegues = [...pieza.pliegues];

  return pliegues.sort((a, b) => {
    // El cierre siempre al final
    if (a.cierra && !b.cierra) return 1;
    if (!a.cierra && b.cierra) return -1;

    // Críticos al final
    if (a.critico && !b.critico) return 1;
    if (!a.critico && b.critico) return -1;

    // Longitud descendente (más grandes primero)
    return b.longitud - a.longitud;
  });
}

// ---------------------------------------------------------
// 9.2 — ORDEN DEL OPERARIO (A/B)
// ---------------------------------------------------------
// A = Asentar primero (pliegue grande antes)
// B = Precisión en pequeños (pliegues pequeños antes)

export function ordenarOperario(pieza: Pieza, modo: "A" | "B"): Pliegue[] {
  const pliegues = [...pieza.pliegues];

  if (modo === "A") {
    // Grande → pequeños → cierre
    return pliegues.sort((a, b) => {
      if (a.cierra && !b.cierra) return 1;
      if (!a.cierra && b.cierra) return -1;
      return b.longitud - a.longitud;
    });
  }

  if (modo === "B") {
    // Pequeños → medianos → grandes → cierre
    return pliegues.sort((a, b) => {
      if (a.cierra && !b.cierra) return 1;
      if (!a.cierra && b.cierra) return -1;
      return a.longitud - b.longitud;
    });
  }

  return pliegues;
}

// ---------------------------------------------------------
// 9.3 — AVISOS DE ACCESIBILIDAD
// ---------------------------------------------------------
// Detecta si un pliegue es físicamente difícil o imposible:
// - Ala demasiado pequeña (< 18 mm) para meter en la V
// - Ángulo muy cerrado (> 160°) que requiere giro especial
// - Secuencia que obliga a meter la pieza ya en forma de U profunda

export function validarAccesibilidad(pieza: Pieza): string[] {
  const avisos: string[] = [];

  pieza.pliegues.forEach((p) => {
    // Ala mínima industrial
    if (p.longitud < 18) {
      avisos.push(
        `⚠️ El pliegue "${p.id}" tiene un ala de ${p.longitud} mm. ` +
          `Es muy pequeño y puede ser difícil de sujetar en la matriz.`,
      );
    }

    // Ángulo muy cerrado
    if (p.angulo > 160) {
      avisos.push(
        `⚠️ El pliegue "${p.id}" tiene un ángulo de ${p.angulo}°. ` +
          `Requiere giro especial y puede marcar la chapa si no se controla.`,
      );
    }
  });

  // Geometría tipo U profunda (canales)
  if (pieza.tipoPieza === "canal") {
    const profundidad = pieza.pliegues.reduce((acc, p) => acc + p.longitud, 0);
    if (profundidad > 200) {
      avisos.push(
        `⚠️ La pieza tiene una profundidad total de ${profundidad} mm. ` +
          `Puede no entrar en la plegadora en ciertos pliegues.`,
      );
    }
  }

  return avisos;
}

// ---------------------------------------------------------
// 9.4 — AVISOS POR GIROS DE CHAPA
// ---------------------------------------------------------
// Basado en tu experiencia real:
// - Frente
// - Hacia adelante
// - Toda fuera
// - Toda dentro

export function calcularGiros(pieza: Pieza): string[] {
  const avisos: string[] = [];

  pieza.pliegues.forEach((p) => {
    if (p.longitud >= 80) {
      avisos.push(
        `ℹ️ El pliegue "${p.id}" (${p.longitud} mm) suele requerir giro hacia adelante.`,
      );
    }

    if (p.longitud <= 20) {
      avisos.push(
        `ℹ️ El pliegue "${p.id}" (${p.longitud} mm) puede requerir "toda la chapa fuera".`,
      );
    }
  });

  return avisos;
}

// ---------------------------------------------------------
// 9.5 — VALIDACIÓN COMPLETA DEL MÓDULO 9
// ---------------------------------------------------------

export function validarModulo9(pieza: Pieza): string[] {
  return [...validarAccesibilidad(pieza), ...calcularGiros(pieza)];
}
