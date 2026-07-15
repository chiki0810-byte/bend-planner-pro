import React, { useState, useEffect } from "react";

import { useSheetStore } from "../stores/sheetStore";

/**
 * Movimiento global de la chapa:
 * - Rotación general del SVG
 * - Traslación general del SVG
 * - Se sincroniza con la simulación completa (pasoActual)
 */

export const MovimientoGlobalChapa: React.FC = () => {
  const { pasoActual, plieguesProcesados } = useSheetStore();

  const [rotacionGlobal, setRotacionGlobal] = useState(0);
  const [trasladoX, setTrasladoX] = useState(0);
  const [trasladoY, setTrasladoY] = useState(0);
  const [activarMovimiento, setActivarMovimiento] = useState(false);

  useEffect(() => {
    if (!activarMovimiento) return;

    // Movimiento suave por cada pliegue
    const id = setInterval(() => {
      setRotacionGlobal((r) => r + 1.2); // rotación suave
      setTrasladoX((x) => x + 0.8);      // desplazamiento horizontal
      setTrasladoY((y) => y + 0.4);      // desplazamiento vertical
    }, 33);

    return () => clearInterval(id);
  }, [activarMovimiento]);

  const iniciar = () => {
    if (plieguesProcesados.length === 0) {
      alert("No hay pliegues para simular movimiento global.");
      return;
    }
    setRotacionGlobal(0);
    setTrasladoX(0);
    setTrasladoY(0);
    setActivarMovimiento(true);
  };

  const detener = () => {
    setActivarMovimiento(false);
  };

  return (
    <div style={panel}>
      <button style={btn} onClick={iniciar}>Movimiento global</button>
      <button style={btnStop} onClick={detener}>Detener</button>

      <div style={{ marginTop: "8px", fontWeight: 600 }}>
        Paso actual: {pasoActual}/{plieguesProcesados.length}
      </div>

      <div>Rotación global: {rotacionGlobal.toFixed(1)}°</div>
      <div>Traslado X: {trasladoX.toFixed(1)} px</div>
      <div>Traslado Y: {trasladoY.toFixed(1)} px</div>

      {/* Capa global aplicada al SVG */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          transform: `translate(${trasladoX}px, ${trasladoY}px) rotate(${rotacionGlobal}deg)`,
          transformOrigin: "center center"
        }}
      />
    </div>
  );
};

const panel: React.CSSProperties = {
  padding: "16px",
  background: "#f0f0f0",
  borderTop: "1px solid #ccc"
};

const btn: React.CSSProperties = {
  padding: "8px 12px",
  background: "#5bc0de",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  marginRight: "8px"
};

const btnStop: React.CSSProperties = {
  padding: "8px 12px",
  background: "#d9534f",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};
