// src/components/PanelPliegue.tsx

import React from "react";
import { useSheetStore } from "../stores/sheetStore";

interface PanelPliegueProps {
  ancho?: number;
}

export const PanelPliegue: React.FC<PanelPliegueProps> = ({ ancho = 280 }) => {
  const { pliegueSeleccionado, plieguesProcesados, setPasoActual } =
    useSheetStore();

  if (!pliegueSeleccionado) {
    return (
      <div
        style={{
          width: ancho,
          padding: "16px",
          background: "#fafafa",
          color: "#777",
          borderBottom: "1px solid #ddd",
        }}
      >
        <h3>Pliegue</h3>
        <p>Selecciona un pliegue en la secuencia o en el visor.</p>
      </div>
    );
  }

  const p = plieguesProcesados.find((x) => x.id === pliegueSeleccionado);

  if (!p) {
    return (
      <div style={{ width: ancho, padding: "16px" }}>
        <h3>Pliegue</h3>
        <p style={{ color: "#c00" }}>Pliegue no encontrado.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: ancho,
        padding: "16px",
        background: "#fafafa",
        borderBottom: "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <h3>Pliegue {p.id}</h3>
      <div><strong>Paso:</strong> {p.paso}</div>
      <div><strong>Ángulo:</strong> {p.angulo.toFixed(1)}°</div>
      <div><strong>Longitud:</strong> {p.longitud.toFixed(1)} mm</div>
      <div><strong>Fuerza:</strong> {p.fuerza.toFixed(1)} kN</div>
      {p.tiempo !== undefined && (
        <div><strong>Tiempo:</strong> {p.tiempo.toFixed(2)} s</div>
      )}
      <div style={{ color: p.colision ? "#c00" : "#090" }}>
        {p.colision ? "⚠ Colisión detectada" : "Sin colisión"}
      </div>
      <button
        onClick={() => setPasoActual(p.paso)}
        style={{
          marginTop: 8,
          padding: "8px 12px",
          background: "#0057ff",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Ir al paso {p.paso}
      </button>
    </div>
  );
};

export default PanelPliegue;
