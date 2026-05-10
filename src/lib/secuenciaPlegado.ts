export interface PliegueSec {
  longitud_mm: number;
  angulo_deg: number;
  cierra_pieza: boolean;
}

export type CategoriaPliegue = "normal" | "delicado" | "critico" | "cierre";

export interface PliegueOrdenado<T extends PliegueSec = PliegueSec> {
  pliegue: T;
  ordenOriginal: number;
  categoria: CategoriaPliegue;
}

const PRIORIDAD: Record<CategoriaPliegue, number> = {
  normal: 0,
  delicado: 1,
  critico: 2,
  cierre: 3,
};

export const categorizarPliegue = (p: PliegueSec): CategoriaPliegue => {
  if (p.cierra_pieza) return "cierre";
  if (p.angulo_deg > 120) return "critico";
  if (p.longitud_mm < 20) return "delicado";
  return "normal";
};

/**
 * Ordena pliegues siguiendo las reglas:
 * 1. cierra_pieza=true → al final
 * 2. ángulo > 120° → críticos, después de normales
 * 3. longitud < 20mm → delicados, antes que críticos y cierre
 * 4. normales primero
 * 5. estable: misma categoría conserva orden original
 */
export const generarSecuenciaPlegado = <T extends PliegueSec>(
  pliegues: T[],
): PliegueOrdenado<T>[] => {
  return pliegues
    .map((pliegue, ordenOriginal) => ({
      pliegue,
      ordenOriginal,
      categoria: categorizarPliegue(pliegue),
    }))
    .sort((a, b) => {
      const dp = PRIORIDAD[a.categoria] - PRIORIDAD[b.categoria];
      if (dp !== 0) return dp;
      return a.ordenOriginal - b.ordenOriginal;
    });
};
