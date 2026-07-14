import React, { useState } from "react";

import { useSheetStore } from "../stores/sheetStore";

export const NormalizacionChapa: React.FC = () => {
  const { plieguesProcesados, setPlieguesProcesados } = useSheetStore();

  const [resultado, setResultado] = useState<string>("");

  const normalizar = () => {
    if (plieguesProcesados.length === 0) {
      setResultado("No hay pliegues para normalizar.");
      return;
    }

    let lista = [...plieguesProcesados];

    // 1) Ordenar por coordenada inicial (x1, y1)
    lista.sort((a, b) => {
      if (a.x1 === b.x1) return (a.y1 ?? 0) - (b.y1 ?? 0);
      return (a.x1 ?? 0) - (b.x1 ?? 0);
    });

    // 2) Reasignar pasos
    lista = lista.map((p, idx) => ({
      ...p,
      paso: idx + 1
    }));

    // 3) Corregir continuidad (si x2,y2 no coincide con siguiente x1,y1)
    for (let i = 0; i < lista.length - 1; i++) {
      const actual = lista[i];
      const siguiente = lista[i + 1];
      const dx = (siguiente.x1 ?? 0) - (actual.x2 ?? 0);
      const dy = (siguiente.y1 ?? 0) - (actual.y2 ?? 0);

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
    lista = lista.map((p) => ({
      ...p,
      longitud: Math.hypot((p.x2 ?? 0) - (p.x1 ?? 0), (p.y2 ?? 0) - (p.y1 ?? 0))
    }));

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
