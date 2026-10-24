/** Devuelve el desarrollo de una punta solo cuando hay datos completos y físicos. */
export function calcularDesarrolloPunta(
  longitudes: number[],
  gananciasPliegue: number[],
): number | undefined {
  if (
    longitudes.length === 0 || longitudes.length !== gananciasPliegue.length ||
    longitudes.some((longitud) => !Number.isFinite(longitud) || longitud <= 0) ||
    gananciasPliegue.some((ganancia) => !Number.isFinite(ganancia) || ganancia < 0)
  ) {
    return undefined;
  }

  const desarrollo = longitudes.reduce((total, longitud) => total + longitud, 0) -
    gananciasPliegue.reduce((total, ganancia) => total + ganancia, 0);
  return Number.isFinite(desarrollo) && desarrollo > 0 ? desarrollo : undefined;
}
