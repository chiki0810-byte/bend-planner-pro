/** Límites de fabricación compartidos por los flujos de cálculo de plegado. */
export const ANGULO_CRITICO_PLEGADO = 130;
export const ANGULO_MAXIMO_PLEGABLE = 160;

/** Comprueba el rango plegable reconocido por el validador industrial. */
export function esAnguloPlegable(angulo: number): boolean {
  return Number.isFinite(angulo) && angulo > 0 && angulo <= ANGULO_MAXIMO_PLEGABLE;
}

/** Ángulos por encima de este umbral pueden requerir dos pasadas. */
export function esAnguloCritico(angulo: number): boolean {
  return Number.isFinite(angulo) && angulo > ANGULO_CRITICO_PLEGADO;
}
