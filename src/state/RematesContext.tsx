import { useEffect, useState, type ReactNode } from "react";
import { RematesCtx, type RematesContextValue, type RemateHistorialItem } from "@/state/RematesContextValue";

export type { RemateHistorialItem } from "@/state/RematesContextValue";

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
    } catch { /* Preserve in-memory history when local storage is unavailable. */ }
  }, [historial]);

  const add: RematesContextValue["add"] = (item) => {
    const nuevo: RemateHistorialItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fecha: new Date().toLocaleString(),
    };
    setHistorial((h) => [nuevo, ...h]);
  };

  const remove: RematesContextValue["remove"] = (id) => setHistorial((h) => h.filter((r) => r.id !== id));
  const get: RematesContextValue["get"] = (id) => historial.find((r) => r.id === id);

  return (
    <RematesCtx.Provider value={{ historial, add, remove, get }}>
      {children}
    </RematesCtx.Provider>
  );
};
