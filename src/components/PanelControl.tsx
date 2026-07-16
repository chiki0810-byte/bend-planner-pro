import React from "react";
import { useSheetStore } from "../stores/sheetStore";

const controlesCompactos: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  padding: "10px",
  justifyContent: "center",
  alignItems: "center",
};

const botonCompacto: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: "14px",
  borderRadius: "6px",
};

interface PanelControlProps {
  ancho?: number;
}

export const PanelControl: React.FC<PanelControlProps> = ({ ancho = 240 }) => {
  const {
    pasoActual,
    setPasoActual,
    plieguesProcesados,
    setZoom,
    setOffset,
    resetVista
  } = useSheetStore();

  const totalPasos = plieguesProcesados.length;

  const avanzarPaso = () => {
    if (pasoActual < totalPasos) setPasoActual(pasoActual + 1);
  };

  const retrocederPaso = () => {
    if (pasoActual > 1) setPasoActual(pasoActual - 1);
  };

  return (
    <div
      style={{
        width: ancho,
        padding: "16px",
        background: "#f0f0f0",
        borderLeft: "1px solid #ccc",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}
    >
      <h3>Controles</h3>

      {/* ZOOM */}
      <div style={controlesCompactos}>
        <button
          onClick={() => setZoom(1.1)}
          style={botonCompacto}
        >
          Zoom +
        </button>
        <button
          onClick={() => setZoom(0.9)}
          style={botonCompacto}
        >
          Zoom –
        </button>
      </div>

      {/* PAN RESET */}
      <button
        onClick={() => resetVista()}
        style={botonCompacto}
      >
        Reset vista
      </button>

      {/* CENTRAR */}
      <button
        onClick={() => setOffset(0, 0)}
        style={botonCompacto}
      >
        Centrar
      </button>

      {/* MODO SECUENCIA */}
      <h4>Modo Secuencia</h4>

      <div style={controlesCompactos}>
        <button onClick={retrocederPaso} style={botonCompacto}>
          ◀
        </button>
        <button onClick={avanzarPaso} style={botonCompacto}>
          ▶
        </button>
      </div>

      <div style={{ fontSize: "14px", color: "#333" }}>
        Paso actual: {pasoActual} / {totalPasos}
      </div>
    </div>
  );
};
