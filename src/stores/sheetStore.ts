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
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface SheetStoreState {
  plieguesProcesados: PliegueProcesado[];
  pliegueSeleccionado: string | null;
  pasoActual: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  ultimoSVG: string | null;
  setPlieguesProcesados: (p: PliegueProcesado[]) => void;
  setPliegueSeleccionado: (id: string | null) => void;
  setPasoActual: (paso: number) => void;
  setZoom: (factor: number) => void;
  setOffset: (x: number, y: number) => void;
  setUltimoSVG: (svg: string | null) => void;
  resetVista: () => void;
  reset: () => void;
}

const listeners = new Set<() => void>();

let state: SheetStoreState = {
  plieguesProcesados: [],
  pliegueSeleccionado: null,
  pasoActual: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  ultimoSVG: null,
  setPlieguesProcesados: (plieguesProcesados) => set({ plieguesProcesados }),
  setPliegueSeleccionado: (pliegueSeleccionado) => set({ pliegueSeleccionado }),
  setPasoActual: (pasoActual) => set({ pasoActual }),
  setZoom: (factor) => set({ zoom: state.zoom * factor }),
  setOffset: (offsetX, offsetY) => set({ offsetX, offsetY }),
  setUltimoSVG: (ultimoSVG) => set({ ultimoSVG }),
  resetVista: () => set({ zoom: 1, offsetX: 0, offsetY: 0 }),
  reset: () =>
    set({
      plieguesProcesados: [],
      pliegueSeleccionado: null,
      pasoActual: 0,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      ultimoSVG: null,
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
