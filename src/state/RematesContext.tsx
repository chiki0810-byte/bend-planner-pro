import { createContext, ReactNode, useContext, useEffect, useState } from "react";

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

interface Ctx {
  historial: RemateHistorialItem[];
  add: (item: Omit<RemateHistorialItem, "id" | "fecha">) => void;
  remove: (id: string) => void;
  get: (id: string) => RemateHistorialItem | undefined;
}

const RematesCtx = createContext<Ctx | null>(null);
const KEY = "historial_remates_v1";

export const RematesProvider = ({ children }: { children: ReactNode }) => {
  const [historial, setHistorial] = useState<RemateHistorialItem[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(historial));
    } catch {}
  }, [historial]);

  const add: Ctx["add"] = (item) => {
    const nuevo: RemateHistorialItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fecha: new Date().toLocaleString(),
    };
    setHistorial((h) => [nuevo, ...h]);
  };

  const remove: Ctx["remove"] = (id) => setHistorial((h) => h.filter((r) => r.id !== id));
  const get: Ctx["get"] = (id) => historial.find((r) => r.id === id);

  return (
    <RematesCtx.Provider value={{ historial, add, remove, get }}>
      {children}
    </RematesCtx.Provider>
  );
};

export const useRemates = () => {
  const v = useContext(RematesCtx);
  if (!v) throw new Error("useRemates must be used within RematesProvider");
  return v;
};
