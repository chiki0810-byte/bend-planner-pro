// ============================================================
// MÓDULO 5 — renderAll (React-friendly)
// Pequeño store con suscripción para que <SheetSVG /> repinte
// cuando se llama a renderAll(changes).
// ============================================================
import { useEffect, useState } from "react";
import { defaultSheetState, type SheetState } from "@/components/SheetSVG";

let currentState: SheetState = defaultSheetState;
const listeners = new Set<(s: SheetState) => void>();

export function getSheetState(): SheetState {
  return currentState;
}

export function setSheetState(next: SheetState) {
  currentState = next;
  listeners.forEach((l) => l(currentState));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("sheet:update", { detail: { state: currentState } }),
    );
  }
}

/**
 * renderAll(changes) — fusiona cambios parciales en el state global
 * y notifica a todos los <SheetSVG /> suscritos para repintar.
 */
export function renderAll(changes: Partial<SheetState> = {}) {
  currentState = { ...currentState, ...changes };
  listeners.forEach((l) => l(currentState));
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("sheet:update", { detail: { changed: changes } }),
    );
  }
}

/** Hook para que cualquier componente reaccione al state global de la chapa. */
export function useSheetState(): SheetState {
  const [s, setS] = useState<SheetState>(currentState);
  useEffect(() => {
    listeners.add(setS);
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s;
}
