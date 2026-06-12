// src/components/PanelSecuencia.tsx

import React from "react";
import { useSheetStore } from "../stores/sheetStore";

interface PanelSecuenciaProps {
  ancho?: number;
}

export const PanelSecuencia: React.FC<PanelSecuenciaProps> = ({ ancho = 260 }) => {
  const {
    plieguesProcesados,
    pliegueSeleccionado,
    setPliegueSeleccionado,
    setPasoActual,
  } = useSheetStore();

  return (
    <div
      style={{
        width: ancho,
        padding: "16px",
        background: "#f4f4f4",
        borderLeft: "1px solid #ddd",
        overflowY: "auto",
        height: "100%",
      }}
    >
      <h3>Secuencia de pliegues</h3>

      {plieguesProcesados.length === 0 && (
        <p style={{ color: "#777" }}>No hay pliegues procesados.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[...plieguesProcesados]
          .sort((a, b) => a.paso - b.paso)
          .map((p) => {
            const seleccionado = p.id === pliegueSeleccionado;

            return (
              <div
                key={p.id}
                onClick={() => {
                  setPliegueSeleccionado(p.id);
                  setPasoActual(p.paso);
                }}
                style={{
                  padding: "10px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: seleccionado ? "#0057ff22" : "#fff",
                  border: seleccionado ? "1px solid #0057ff" : "1px solid #ddd",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  Paso {p.paso} — Pliegue {p.id}
                </div>

                <div style={{ fontSize: "13px", color: "#444" }}>
                  Ángulo: {p.angulo.toFixed(1)}°
                </div>

                <div style={{ fontSize: "13px", color: "#444" }}>
                  Longitud: {p.longitud.toFixed(1)} mm
                </div>

                <div style={{ fontSize: "13px", color: p.colision ? "#c00" : "#090" }}>
                  {p.colision ? "⚠ Colisión detectada" : "Sin colisión"}
                </div>

                <div style={{ fontSize: "13px", color: "#444" }}>
                  Fuerza: {p.fuerza.toFixed(1)} kN
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default PanelSecuencia;
