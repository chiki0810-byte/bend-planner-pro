import { createContext } from "react";

export interface RemateHistorialItem {
  id: string;
  fecha: string;
  tipo: "recto" | "conico";
  derecha: number;
  izquierda: number;
  puntaA: number;
  puntaB: number;
  altura: number;
  espesor: number;
  material: string;
  solape: number;
  desarrollo_derecha: number;
  desarrollo_izquierda: number;
  desarrollo_puntaA: number;
  desarrollo_puntaB: number;
  desarrollo_total: number;
  foto: string | null;
}

export interface RematesContextValue {
  historial: RemateHistorialItem[];
  add: (item: Omit<RemateHistorialItem, "id" | "fecha">) => void;
  remove: (id: string) => void;
  get: (id: string) => RemateHistorialItem | undefined;
}

export const RematesCtx = createContext<RematesContextValue | null>(null);
