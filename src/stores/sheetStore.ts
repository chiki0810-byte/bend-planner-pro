// src/stores/sheetStore.ts
// Store ligero para la UI 2D de pliegues (sin dependencias externas).
// Expone un hook `useSheetStore` con la misma forma de uso que zustand.

import { useSyncExternalStore } from "react";

export interface PliegueProcesado {
  id: string;
  paso: number;
  angulo: number;
  longitud: number;
  colision: boolean;
  fuerza: number;
  tiempo?: number;
}

export interface SheetStoreState {
  plieguesProcesados: PliegueProcesado[];
  pliegueSeleccionado: string | null;
  pasoActual: number;
  setPlieguesProcesados: (p: PliegueProcesado[]) => void;
  setPliegueSeleccionado: (id: string | null) => void;
  setPasoActual: (paso: number) => void;
  reset: () => void;
}

const listeners = new Set<() => void>();

let state: SheetStoreState = {
  plieguesProcesados: [],
  pliegueSeleccionado: null,
  pasoActual: 0,
  setPlieguesProcesados: (plieguesProcesados) => set({ plieguesProcesados }),
  setPliegueSeleccionado: (pliegueSeleccionado) => set({ pliegueSeleccionado }),
  setPasoActual: (pasoActual) => set({ pasoActual }),
  reset: () =>
    set({
      plieguesProcesados: [],
      pliegueSeleccionado: null,
      pasoActual: 0,
    }),
};

function set(partial: Partial<SheetStoreState>) {
  state = { ...state, ...partial };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SheetStoreState {
  return state;
}

export function useSheetStore(): SheetStoreState;
export function useSheetStore<T>(selector: (s: SheetStoreState) => T): T;
export function useSheetStore<T>(selector?: (s: SheetStoreState) => T) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector ? selector(snap) : snap;
}

// Acceso imperativo (fuera de React)
export const sheetStore = {
  getState: () => state,
  setState: set,
  subscribe,
};
