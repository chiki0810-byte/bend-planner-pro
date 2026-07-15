import React, { useEffect, useState } from "react";

import { useSheetStore } from "../stores/sheetStore";

/**
 * Simulación completa de la chapa:
 * - Reproduce todos los pliegues en secuencia.
 * - Cada pliegue se anima con un ángulo progresivo.
 * - Avanza automáticamente al siguiente.
 * - Se detiene al finalizar la secuencia.
 */

export const SimulacionCompletaChapa: React.FC = () => {
  const { plieguesProcesados, pasoActual, setPasoActual } = useSheetStore();

  const [anguloAnimado, setAnguloAnimado] = useState(0);
  const [simulando, setSimulando] = useState(false);

  useEffect(() => {
    if (!simulando) return;

    if (pasoActual > plieguesProcesados.length) {
      setSimulando(false);
      return;
    }

    const pliegue = plieguesProcesados[pasoActual - 1];

    if (!pliegue || !pliegue.x1 || !pliegue.y1 || !pliegue.x2 || !pliegue.y2) {
      // Saltar pliegues incompletos
      setPasoActual(pasoActual + 1);
      return;
    }

    let frame = 0;
    const duracion = 30; // ~1 segundo

    const id = setInterval(() => {
      frame += 1;
      const progreso = frame / duracion;

      if (progreso >= 1) {
        setAnguloAnimado(pliegue.angulo);
        clearInterval(id);

        // Avanzar al siguiente pliegue
        setPasoActual(pasoActual + 1);
        setAnguloAnimado(0);
      } else {
        setAnguloAnimado(pliegue.angulo * progreso);
      }
    }, 33);

    return () => clearInterval(id);
  }, [simulando, pasoActual, plieguesProcesados.length, setPasoActual]);

  const iniciar = () => {
    if (plieguesProcesados.length === 0) {
      alert("No hay pliegues para simular.");
      return;
    }

    setPasoActual(1);
    setAnguloAnimado(0);
    setSimulando(true);
  };

  const detener = () => {
    setSimulando(false);
    setAnguloAnimado(0);
  };

  const pliegue = plieguesProcesados[pasoActual - 1];

  if (!simulando || !pliegue) {
    return (
      <div style={panel}>
        <button style={btn} onClick={iniciar}>Simular toda la chapa</button>
      </div>
    );
  }

  const cx = pliegue.x1 ?? 0;
  const cy = pliegue.y1 ?? 0;
  const linea = `M ${pliegue.x1} ${pliegue.y1} L ${pliegue.x2} ${pliegue.y2}`;

  return (
    <div style={panel}>
      <button style={btnStop} onClick={detener}>Detener</button>
      <div style={{ marginTop: "8px", fontWeight: 600 }}>
        Pliegue {pasoActual}/{plieguesProcesados.length}
      </div>
      <div>Ángulo: {anguloAnimado.toFixed(0)}°</div>
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        <path
          d={linea}
          stroke="orange"
          strokeWidth="3"
          transform={`rotate(${anguloAnimado}, ${cx}, ${cy})`}
        />
      </svg>
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
  background: "#5cb85c",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};

const btnStop: React.CSSProperties = {
  padding: "8px 12px",
  background: "#d9534f",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer"
};
