import React, { useState, useEffect } from "react";
import { useSheetStore } from "../stores/sheetStore";

export const SimulacionChapa: React.FC = () => {
  const { plieguesProcesados, pasoActual, setPasoActual } = useSheetStore();

  const [animando, setAnimando] = useState(false);
  const [progreso, setProgreso] = useState(0); // 0–1 animación del pliegue actual

  useEffect(() => {
    if (!animando) return;

    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      const p = frame / 30; // duración ~1 segundo

      if (p >= 1) {
        setProgreso(1);
        clearInterval(id);
        setAnimando(false);

        // avanzar al siguiente pliegue
        if (pasoActual < plieguesProcesados.length) {
          setPasoActual(pasoActual + 1);
          setProgreso(0);
        }
      } else {
        setProgreso(p);
      }
    }, 33);

    return () => clearInterval(id);
  }, [animando, pasoActual, plieguesProcesados.length, setPasoActual]);

  const iniciarSimulacion = () => {
    if (plieguesProcesados.length === 0) {
      alert("No hay pliegues para simular.");
      return;
    }

    setPasoActual(1);
    setProgreso(0);
    setAnimando(true);
  };

  const detenerSimulacion = () => {
    setAnimando(false);
    setProgreso(0);
  };

  const pliegueActual = plieguesProcesados[pasoActual - 1];

  return (
    <div
      style={{
        padding: "16px",
        background: "#f0f0f0",
        borderTop: "1px solid #ccc"
      }}
    >
      <button onClick={iniciarSimulacion} style={btn}>
        Iniciar simulación
      </button>
      <button
        onClick={detenerSimulacion}
        style={{ ...btn, background: "#d9534f" }}
      >
        Detener
      </button>

      <div style={{ marginTop: "12px", fontWeight: 600 }}>
        Paso actual: {pasoActual}/{plieguesProcesados.length}
      </div>

      {pliegueActual && (
        <div style={{ marginTop: "8px" }}>
          <div>Ángulo objetivo: {pliegueActual.angulo}°</div>
          <div>Progreso: {(progreso * 100).toFixed(0)}%</div>
        </div>
      )}
    </div>
  );
};

const btn: React.CSSProperties = {
  padding: "8px 12px",
  background: "#0275d8",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  marginRight: "8px"
};
