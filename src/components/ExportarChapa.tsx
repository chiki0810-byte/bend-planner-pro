// src/components/ExportarChapa.tsx

import React from "react";
import { useSheetStore, PliegueProcesado } from "../stores/sheetStore";

function descargarArchivo(nombre: string, contenido: string, mime: string) {
  const blob = new Blob([contenido], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generarDXF(pliegues: PliegueProcesado[]): string {
  // DXF mínimo con una LINE por pliegue (representación lineal por longitud).
  const header = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
  const footer = `0\nENDSEC\n0\nEOF\n`;

  let x = 0;
  const y = 0;
  const entidades = [...pliegues]
    .sort((a, b) => a.paso - b.paso)
    .map((p) => {
      const x1 = x;
      const x2 = x + p.longitud;
      x = x2 + 10;
      return (
        `0\nLINE\n8\nPLIEGUES\n` +
        `10\n${x1.toFixed(3)}\n20\n${y.toFixed(3)}\n30\n0.0\n` +
        `11\n${x2.toFixed(3)}\n21\n${y.toFixed(3)}\n31\n0.0\n`
      );
    })
    .join("");

  return header + entidades + footer;
}

export const ExportarChapa: React.FC = () => {
  const { plieguesProcesados, ultimoSVG } = useSheetStore();

  const exportarJSON = () => {
    const data = JSON.stringify(plieguesProcesados, null, 2);
    descargarArchivo("pliegues.json", data, "application/json");
  };

  const exportarSVG = () => {
    if (!ultimoSVG) {
      alert("No hay SVG generado todavía.");
      return;
    }
    descargarArchivo("chapa.svg", ultimoSVG, "image/svg+xml");
  };

  const exportarDXF = () => {
    const dxf = generarDXF(plieguesProcesados);
    descargarArchivo("chapa.dxf", dxf, "application/dxf");
  };

  return (
    <div
      style={{
        padding: "16px",
        background: "#f0f0f0",
        borderTop: "1px solid #ccc",
        display: "flex",
        gap: "12px",
      }}
    >
      <button onClick={exportarJSON} style={btn}>
        Exportar JSON
      </button>
      <button onClick={exportarSVG} style={btn}>
        Exportar SVG
      </button>
      <button onClick={exportarDXF} style={btn}>
        Exportar DXF
      </button>
    </div>
  );
};

const btn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#0057ff",
  color: "white",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

export default ExportarChapa;
