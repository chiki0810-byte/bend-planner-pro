// Sugeridor de Vueltas (BLOQUE 5).
// Asistente lógico que recomienda el orden óptimo de pliegues.
// No es simulador 3D ni sustituye a software profesional.

import type { PliegueValidacion, ValidacionResultado } from "./validarPieza";

export interface SugerirInput {
  pliegues: PliegueValidacion[];
  desarrolloTotal: number;
  desarrolloPuntaA: number;
  desarrolloPuntaB: number;
  material: string;
  remateDesigual?: boolean;
  validacion?: ValidacionResultado;
}

export interface PasoSugerido {
  ordenOriginal: number;     // 1-based
  paso: number;              // 1-based en la secuencia recomendada
  punta: "A" | "B";
  longitud: number;
  angulo: number;
  orientacion: "up" | "down";
  requiereGiro: boolean;
  motivo: string;
  avisoChoque?: string;
}

export interface SugerirResultado {
  pasos: PasoSugerido[];
  avisos: string[];
  observaciones: string[];
  empezarPor?: "A" | "B";
}

function clasificar(p: PliegueValidacion): { grupo: 0 | 1 | 2; etiqueta: string } {
  // 0 = grandes (al principio), 1 = pequeños, 2 = retornos (al final)
  if (p.cierra) return { grupo: 2, etiqueta: "Retorno / cierre — al final" };
  const grande = p.angulo >= 90 || p.longitud >= 50;
  return grande
    ? { grupo: 0, etiqueta: "Grande (ángulo ≥90° o ala ≥50 mm) — primero" }
    : { grupo: 1, etiqueta: "Pequeño — después" };
}

export function sugerirVueltas(input: SugerirInput): SugerirResultado {
  const avisos: string[] = [];
  const observaciones: string[] = [];

  // Empezar por el lado más largo si remate desigual
  let empezarPor: "A" | "B" | undefined;
  const desigual =
    input.remateDesigual ??
    Math.abs(input.desarrolloPuntaA - input.desarrolloPuntaB) > 0.5;
  if (desigual) {
    empezarPor = input.desarrolloPuntaA >= input.desarrolloPuntaB ? "A" : "B";
    observaciones.push(
      `Remate desigual: empezar por la Punta ${empezarPor} (lado más largo).`
    );
  }

  // Indexar y ordenar
  const indexed = input.pliegues.map((p, i) => ({ p, i, info: clasificar(p) }));

  indexed.sort((a, b) => {
    // 1) grupo (grandes → pequeños → retornos)
    if (a.info.grupo !== b.info.grupo) return a.info.grupo - b.info.grupo;
    // 2) si hay lado de inicio preferido, ese primero
    if (empezarPor) {
      const aPref = a.p.punta === empezarPor ? 0 : 1;
      const bPref = b.p.punta === empezarPor ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;
    }
    // 3) ángulo grande primero
    if (a.p.angulo !== b.p.angulo) return b.p.angulo - a.p.angulo;
    // 4) longitud larga primero
    return b.p.longitud - a.p.longitud;
  });

  // Detección de choques con respecto al orden original (siguiente pliegue)
  const pasos: PasoSugerido[] = indexed.map((s, k) => {
    const sigOriginal = input.pliegues[s.i + 1];
    let avisoChoque: string | undefined;
    if (sigOriginal && s.p.orientacion === "down" && sigOriginal.longitud < 20) {
      avisoChoque = `Pliegue hacia dentro con ala siguiente corta (${sigOriginal.longitud} mm). Riesgo de choque.`;
      avisos.push(`Pliegue ${s.i + 1}: ${avisoChoque}`);
    }

    // Giro: si cambia la punta respecto al paso anterior
    const prev = k > 0 ? indexed[k - 1] : undefined;
    const requiereGiro = !!prev && prev.p.punta !== s.p.punta;

    return {
      ordenOriginal: s.i + 1,
      paso: k + 1,
      punta: s.p.punta,
      longitud: s.p.longitud,
      angulo: s.p.angulo,
      orientacion: s.p.orientacion,
      requiereGiro,
      motivo: s.info.etiqueta,
      avisoChoque,
    };
  });

  // Heredar avisos del bloque 4 si vienen
  if (input.validacion) {
    input.validacion.avisos
      .filter((a) => a.codigo === "POSIBLE_CHOQUE" || a.codigo === "ALA_CORTA")
      .forEach((a) => avisos.push(`(BLOQUE 4) ${a.mensaje}`));
  }

  observaciones.push(
    `Secuencia: ${input.pliegues.length} pliegues · ${pasos.filter((p) => p.requiereGiro).length} giros sugeridos.`
  );
  observaciones.push(`Material: ${input.material || "no especificado"}.`);

  return { pasos, avisos, observaciones, empezarPor };
}
