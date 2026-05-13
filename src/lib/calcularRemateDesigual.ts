// BLOQUE 2.5 — Remates Desiguales
// Cálculo industrial avanzado para alas A/B distintas y corte cejo.
// No sustituye a software profesional; ofrece BA, BD, K dinámico
// y corrección por longitud antes de programar la pieza.

import type { ValidacionResultado } from "./validarPieza";

export type TipoRemate = "normal" | "cejo";

export interface RemateInput {
  longitudTotal: number;
  alaA: number;
  alaB: number;
  espesor: number;
  radio: number;
  angulo: number; // grados
  material: string;
  tipo: TipoRemate;
  validacion?: ValidacionResultado;
}

export interface RemateAviso {
  nivel: "info" | "warn" | "error";
  mensaje: string;
}

export interface RemateResultado {
  ba: number;              // Bend Allowance
  bd: number;              // Bend Deduction (BA + corrección por alas desiguales)
  kDinamico: number;
  correccionLongitud: number;
  reduccionCejo: number;   // mm restados al lado más corto si tipo=cejo
  desarrolloTotal: number;
  alaAFinal: number;
  alaBFinal: number;
  avisos: RemateAviso[];
}

// K dinámico aproximado en función de espesor y ángulo.
function calcularKDinamico(espesor: number, angulo: number): number {
  // base K según espesor (rangos típicos chapa fina)
  let k = 0.33;
  if (espesor <= 0.6) k = 0.38;
  else if (espesor <= 1.0) k = 0.36;
  else if (espesor <= 1.5) k = 0.33;
  else if (espesor <= 2.5) k = 0.31;
  else k = 0.29;
  // ajuste por ángulo: ángulos pequeños tiran hacia menor K
  if (angulo < 60) k -= 0.02;
  else if (angulo > 120) k += 0.02;
  return Math.max(0.2, Math.min(0.5, +k.toFixed(3)));
}

export function calcularRemateDesigual(input: RemateInput): RemateResultado {
  const { alaA, alaB, espesor, radio, angulo, tipo } = input;
  const avisos: RemateAviso[] = [];

  const k = calcularKDinamico(espesor, angulo);

  // A) BA = (π/180) · θ · (R + K·t)
  const ba = +((Math.PI / 180) * angulo * (radio + k * espesor)).toFixed(3);

  // B) BD = BA + corrección por alas desiguales
  const diff = Math.abs(alaA - alaB);
  const correccionAlas = +(diff * 0.05).toFixed(3); // 5% del desnivel
  const bd = +(ba + correccionAlas).toFixed(3);

  // D) Corrección por longitud (si A ≠ B)
  let correccionLongitud = 0;
  if (diff > 0.5) {
    correccionLongitud = +(diff * 0.02).toFixed(3); // 2% del desnivel
    avisos.push({
      nivel: "info",
      mensaje: `Alas desiguales (Δ ${diff.toFixed(1)} mm): aplicando corrección de ${correccionLongitud} mm.`,
    });
  }

  // E) Corte cejo — reducción en el lado más corto
  let reduccionCejo = 0;
  let alaAFinal = alaA;
  let alaBFinal = alaB;
  if (tipo === "cejo") {
    reduccionCejo = +(Math.min(alaA, alaB) * 0.05).toFixed(3); // 5% del lado corto
    if (alaA <= alaB) alaAFinal = +(alaA - reduccionCejo).toFixed(3);
    else alaBFinal = +(alaB - reduccionCejo).toFixed(3);
    avisos.push({
      nivel: "warn",
      mensaje: `Corte cejo: reducción de ${reduccionCejo} mm en el lado más corto.`,
    });
  }

  // Avisos industriales adicionales
  if (Math.min(alaA, alaB) < 10) {
    avisos.push({
      nivel: "error",
      mensaje: "Ala crítica (<10 mm). Verifica antes de plegar.",
    });
  }
  if (diff > Math.max(alaA, alaB) * 0.5) {
    avisos.push({
      nivel: "warn",
      mensaje: "Diferencia entre alas >50%. Riesgo de remate visualmente irregular.",
    });
  }

  // F) Desarrollo total avanzado
  const desarrolloTotal = +(
    alaAFinal + alaBFinal + ba + correccionAlas + correccionLongitud
  ).toFixed(3);

  // Heredar avisos del bloque 4 si existen
  if (input.validacion) {
    input.validacion.avisos
      .filter((a) => a.codigo === "ALA_CORTA" || a.codigo === "REMATE_DESIGUAL")
      .forEach((a) => avisos.push({ nivel: a.nivel, mensaje: `(BLOQUE 4) ${a.mensaje}` }));
  }

  return {
    ba,
    bd,
    kDinamico: k,
    correccionLongitud,
    reduccionCejo,
    desarrolloTotal,
    alaAFinal,
    alaBFinal,
    avisos,
  };
}
