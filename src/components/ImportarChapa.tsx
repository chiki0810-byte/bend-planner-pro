// src/components/ImportarChapa.tsx

import React from "react";
import { useSheetStore, PliegueProcesado } from "../stores/sheetStore";
import { parseDxfLines } from "../lib/dxfImport";
import { parseJsonPliegues } from "../lib/jsonPlieguesImport";

export const ImportarChapa: React.FC = () => {
  const {
    setPlieguesProcesados,
    setPliegueSeleccionado,
    setPasoActual,
    setUltimoSVG,
  } = useSheetStore();

  const aplicarPlieguesImportados = (pliegues: PliegueProcesado[]) => {
    setPlieguesProcesados(pliegues);
    setPliegueSeleccionado(null);
    setPasoActual(0);
  };

  const manejarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const nombre = archivo.name.toLowerCase();

    if (nombre.endsWith(".json")) {
      await importarJSON(archivo);
    } else if (nombre.endsWith(".svg")) {
      await importarSVG(archivo);
    } else if (nombre.endsWith(".dxf")) {
      await importarDXF(archivo);
    } else {
      alert("Formato no soportado. Usa JSON, SVG o DXF.");
    }

    // Permitir re-importar el mismo archivo
    e.target.value = "";
  };

  const importarJSON = async (archivo: File) => {
    const texto = await archivo.text();
    try {
      const data = JSON.parse(texto);
      const pliegues = parseJsonPliegues(data);
      aplicarPlieguesImportados(pliegues);
    } catch (err) {
      console.error(err);
      alert("Error al leer JSON.");
    }
  };

  const importarSVG = async (archivo: File) => {
    const texto = await archivo.text();
    setUltimoSVG(texto);
  };

  const importarDXF = async (archivo: File) => {
    const texto = await archivo.text();
    try {
      const pliegues: PliegueProcesado[] = parseDxfLines(texto)
        .filter((line) => line.layer?.toUpperCase() !== "CUT")
        .map((line, index) => ({
          id: `p${index + 1}`,
          paso: index + 1,
          angulo: 90,
          longitud: line.length,
          colision: false,
          fuerza: 0,
          x1: line.x1,
          y1: line.y1,
          x2: line.x2,
          y2: line.y2,
        }));

      if (pliegues.length === 0) {
        alert("No se detectaron entidades LINE en el DXF.");
        return;
      }
      aplicarPlieguesImportados(pliegues);
    } catch (err) {
      console.error(err);
      alert("Error al leer DXF.");
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        background: "#f0f0f0",
        borderTop: "1px solid #ccc",
        display: "flex",
        gap: "12px",
        alignItems: "center",
      }}
    >
      <label style={btn}>
        Importar archivo
        <input
          type="file"
          accept=".json,.svg,.dxf"
          onChange={manejarArchivo}
          style={{ display: "none" }}
        />
      </label>
      <span style={{ fontSize: 13, color: "#555" }}>
        Formatos: JSON, SVG, DXF
      </span>
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

export default ImportarChapa;
