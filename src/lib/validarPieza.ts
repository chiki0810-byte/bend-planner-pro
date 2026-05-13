// Validación industrial de pieza (BLOQUE 4).
// No sustituye a un software profesional tipo Estefa VH.
// Detecta problemas evidentes antes de programar la pieza.

export type Orientacion = "up" | "down";

export interface PliegueValidacion {
  punta: "A" | "B";
  longitud: number;
  angulo: number;          // ángulo real
  anguloMaquina: number;   // 180 - ángulo real
  orientacion: Orientacion;
  radio: number;
  espesor: number;
  cierra?: boolean;
}

export interface ValidacionInput {
  pliegues: PliegueValidacion[];
  desarrolloTotal: number;
  desarrolloPuntaA: number;
  desarrolloPuntaB: number;
  material: string;
  remateDesigual?: boolean;
}

export type AvisoNivel = "error" | "warn" | "info";

export interface Aviso {
  nivel: AvisoNivel;
  codigo: string;
  mensaje: string;
  pliegue?: number; // 1-based
}

export interface PliegueOrden {
  ordenOriginal: number;
  ordenRecomendado: number;
  punta: "A" | "B";
  longitud: number;
  angulo: number;
  motivo: string;
}

export interface ValidacionResultado {
  avisos: Aviso[];
  ordenRecomendado: PliegueOrden[];
  observaciones: string[];
}

// ============= validarPieza =============
export function validarPieza(input: ValidacionInput): ValidacionResultado {
  const avisos: Aviso[] = [];
  const observaciones: string[] = [];

  input.pliegues.forEach((p, i) => {
    const idx = i + 1;

    // A) Ala mínima
    if (p.longitud < 10) {
      avisos.push({
        nivel: "error",
        codigo: "ALA_CORTA",
        pliegue: idx,
        mensaje: `Pliegue ${idx}: ala demasiado corta para plegar (${p.longitud} mm < 10 mm).`,
      });
    } else if (p.longitud < 15) {
      avisos.push({
        nivel: "warn",
        codigo: "ALA_JUSTA",
        pliegue: idx,
        mensaje: `Pliegue ${idx}: ala muy justa (${p.longitud} mm). Revisar herramienta.`,
      });
    }

    // B) Ángulo máximo
    if (p.angulo > 130) {
      avisos.push({
        nivel: "warn",
        codigo: "ANGULO_CRITICO",
        pliegue: idx,
        mensaje: `Pliegue ${idx}: ángulo ${p.angulo}° crítico, puede requerir dos pasadas.`,
      });
    }
    if (p.angulo > 160) {
      avisos.push({
        nivel: "error",
        codigo: "ANGULO_IMPOSIBLE",
        pliegue: idx,
        mensaje: `Pliegue ${idx}: ángulo ${p.angulo}° fuera de rango plegable.`,
      });
    }

    // C) Choque evidente: pliegue hacia dentro y ala siguiente corta
    const sig = input.pliegues[i + 1];
    if (sig && p.orientacion === "down" && sig.longitud < 20) {
      avisos.push({
        nivel: "warn",
        codigo: "POSIBLE_CHOQUE",
        pliegue: idx,
        mensaje: `Pliegue ${idx}: posible choque entre ala (${sig.longitud} mm) y herramienta.`,
      });
    }

    // Espesor fuera de rango básico
    if (p.espesor && (p.espesor < 0.4 || p.espesor > 6)) {
      avisos.push({
        nivel: "warn",
        codigo: "ESPESOR",
        pliegue: idx,
        mensaje: `Pliegue ${idx}: espesor ${p.espesor} mm fuera de rango habitual.`,
      });
    }
  });

  // E) Remates desiguales
  const desigual =
    input.remateDesigual ?? Math.abs(input.desarrolloPuntaA - input.desarrolloPuntaB) > 0.5;
  if (desigual) {
    avisos.push({
      nivel: "info",
      codigo: "REMATE_DESIGUAL",
      mensaje: `Remate desigual (A=${input.desarrolloPuntaA.toFixed(
        1
      )} ≠ B=${input.desarrolloPuntaB.toFixed(1)}). Revisar corte cejo y desarrollo.`,
    });
  }

  // D) Orden recomendado: grandes primero, pequeños después, retornos (cierra) al final
  const indexed = input.pliegues.map((p, i) => ({ p, i }));
  const sorted = [...indexed].sort((a, b) => {
    const aClose = a.p.cierra ? 1 : 0;
    const bClose = b.p.cierra ? 1 : 0;
    if (aClose !== bClose) return aClose - bClose; // los que cierran al final
    // mayor longitud primero
    return b.p.longitud - a.p.longitud;
  });

  const ordenRecomendado: PliegueOrden[] = sorted.map((s, k) => ({
    ordenOriginal: s.i + 1,
    ordenRecomendado: k + 1,
    punta: s.p.punta,
    longitud: s.p.longitud,
    angulo: s.p.angulo,
    motivo: s.p.cierra
      ? "Retorno / cierre — al final"
      : s.p.longitud >= 50
      ? "Pliegue grande — primero"
      : "Pliegue pequeño — después",
  }));

  // Observaciones generales
  observaciones.push(
    `Material: ${input.material || "no especificado"} · Desarrollo total D:${input.desarrolloTotal.toFixed(
      0
    )} mm.`
  );
  if (input.pliegues.length === 0) {
    observaciones.push("La pieza no tiene pliegues definidos.");
  } else {
    observaciones.push(
      `${input.pliegues.length} pliegues · ${avisos.filter((a) => a.nivel === "error").length} errores · ${
        avisos.filter((a) => a.nivel === "warn").length
      } avisos.`
    );
  }

  return { avisos, ordenRecomendado, observaciones };
}
