import React, { useState } from "react";

import { useSheetStore } from "../stores/sheetStore";

const TOLERANCIA_CONTINUIDAD_MM = 0.001;

const puntosCoinciden = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => Math.hypot(x1 - x2, y1 - y2) <= TOLERANCIA_CONTINUIDAD_MM;

export const ValidacionChapa: React.FC = () => {
  const { plieguesProcesados } = useSheetStore();

  const [resultado, setResultado] = useState<string>("");

  const validar = () => {
    const errores: string[] = [];

    if (plieguesProcesados.length === 0) {
      errores.push("No hay pliegues cargados.");
    }

    // 1) Validación de longitud
    plieguesProcesados.forEach((p, idx) => {
      if (p.longitud <= 0 || isNaN(p.longitud)) {
        errores.push(`Pliegue ${idx + 1}: longitud inválida.`);
      }
    });

    // 2) Detección de líneas sueltas (sin continuidad)
    for (let i = 0; i < plieguesProcesados.length - 1; i++) {
      const a = plieguesProcesados[i];
      const b = plieguesProcesados[i + 1];
      const aTieneCoords = [a.x1, a.y1, a.x2, a.y2].every(
        (coordenada) => typeof coordenada === "number" && Number.isFinite(coordenada),
      );
      const bTieneCoords = [b.x1, b.y1, b.x2, b.y2].every(
        (coordenada) => typeof coordenada === "number" && Number.isFinite(coordenada),
      );
      if (!aTieneCoords || !bTieneCoords) {
        continue;
      }
      const conecta =
        puntosCoinciden(a.x2!, a.y2!, b.x1!, b.y1!) ||
        puntosCoinciden(a.x1!, a.y1!, b.x2!, b.y2!);
      if (!conecta) {
        errores.push(`Pliegue ${i + 1} y ${i + 2} no están conectados.`);
      }
    }

    // 3) Validación de ángulos
    plieguesProcesados.forEach((p, idx) => {
      if (p.angulo < 0 || p.angulo > 180) {
        errores.push(`Pliegue ${idx + 1}: ángulo fuera de rango (0–180).`);
      }
    });

    // 4) Validación de pasos
    plieguesProcesados.forEach((p, idx) => {
      if (p.paso !== idx + 1) {
        errores.push(`Pliegue ${idx + 1}: paso incorrecto (debe ser ${idx + 1}).`);
      }
    });

    // Resultado final
    if (errores.length === 0) {
      setResultado("✔ Validación correcta. No se encontraron errores.");
    } else {
      setResultado("❌ Errores detectados:\n" + errores.join("\n"));
    }
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
        onClick={validar}
        style={{
          padding: "8px 12px",
          background: "#d9534f",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Validar dibujo
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
