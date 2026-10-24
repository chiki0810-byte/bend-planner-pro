import React, { useState } from "react";

import { useSheetStore, type PliegueProcesado } from "../stores/sheetStore";

const tieneCoordenadasValidas = (pliegue: PliegueProcesado) =>
  [pliegue.x1, pliegue.y1, pliegue.x2, pliegue.y2].every(
    (coordenada) => typeof coordenada === "number" && Number.isFinite(coordenada),
  );

export const NormalizacionChapa: React.FC = () => {
  const { plieguesProcesados, setPlieguesProcesados } = useSheetStore();

  const [resultado, setResultado] = useState<string>("");

  const normalizar = () => {
    if (plieguesProcesados.length === 0) {
      setResultado("No hay pliegues para normalizar.");
      return;
    }

    let lista = [...plieguesProcesados];

    // Ordenar solo si todas las líneas tienen geometría completa.
    // Si falta alguna coordenada, conservar el orden recibido sin asumir cero.
    if (lista.every(tieneCoordenadasValidas)) {
      lista.sort((a, b) => {
        if (a.x1 === b.x1) return a.y1! - b.y1!;
        return a.x1! - b.x1!;
      });
    }

    // 2) Reasignar pasos
    lista = lista.map((p, idx) => ({
      ...p,
      paso: idx + 1
    }));

    // 3) Corregir continuidad (si x2,y2 no coincide con siguiente x1,y1)
    for (let i = 0; i < lista.length - 1; i++) {
      const actual = lista[i];
      const siguiente = lista[i + 1];
      if (!tieneCoordenadasValidas(actual) || !tieneCoordenadasValidas(siguiente)) {
        continue;
      }
      const dx = siguiente.x1! - actual.x2!;
      const dy = siguiente.y1! - actual.y2!;

      // Si hay un salto pequeño, lo corregimos
      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
        siguiente.x1 = actual.x2;
        siguiente.y1 = actual.y2;
      }
    }

    // 4) Normalizar ángulos (si vienen corruptos)
    lista = lista.map((p) => ({
      ...p,
      angulo: isNaN(p.angulo) ? 90 : p.angulo,
    }));

    // 5) Recalcular longitud
    lista = lista.map((p) => {
      if (!tieneCoordenadasValidas(p)) return p;

      const longitud = Math.hypot(p.x2! - p.x1!, p.y2! - p.y1!);
      return Number.isFinite(longitud) ? { ...p, longitud } : p;
    });

    // Guardar resultado
    setPlieguesProcesados(lista);
    setResultado("✔ Normalización completada correctamente.");
  };

  return (
    <div
      style={{
        padding: "16px",
        background: "#f0f0f0",
        borderTop: "1px solid #ccc"
      }}
    >
      <button
        onClick={normalizar}
        style={{
          padding: "8px 12px",
          background: "#0275d8",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Normalizar dibujo
      </button>
      <pre
        style={{
          marginTop: "12px",
          background: "#fff",
          padding: "12px",
          borderRadius: "4px",
          whiteSpace: "pre-wrap"
        }}
      >
        {resultado}
      </pre>
    </div>
  );
};
