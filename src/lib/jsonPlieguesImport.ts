import type { PliegueProcesado } from "../stores/sheetStore";

function coordenadaOpcional(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function parseJsonPliegues(data: unknown): PliegueProcesado[] {
  if (!Array.isArray(data)) {
    throw new Error("El JSON no contiene una lista de pliegues.");
  }

  return data.map((item: unknown, index: number) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("El JSON contiene un pliegue no válido.");
    }

    const p = item as Record<string, unknown>;
    return {
      id: String(p.id ?? `p${index + 1}`),
      paso: Number(p.paso ?? index + 1),
      angulo: Number(p.angulo ?? 90),
      longitud: Number(p.longitud ?? 100),
      colision: Boolean(p.colision ?? false),
      fuerza: Number(p.fuerza ?? 0),
      tiempo: p.tiempo != null ? Number(p.tiempo) : undefined,
      x1: coordenadaOpcional(p.x1),
      y1: coordenadaOpcional(p.y1),
      x2: coordenadaOpcional(p.x2),
      y2: coordenadaOpcional(p.y2),
    };
  });
}
