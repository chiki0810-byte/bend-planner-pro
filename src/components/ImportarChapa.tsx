// src/components/ImportarChapa.tsx

import React from "react";
import { useSheetStore, PliegueProcesado } from "../stores/sheetStore";

export const ImportarChapa: React.FC = () => {
  const { setPlieguesProcesados, setUltimoSVG } = useSheetStore();

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
      if (!Array.isArray(data)) {
        alert("El JSON no contiene una lista de pliegues.");
        return;
      }
      const pliegues: PliegueProcesado[] = data.map((p, i) => ({
        id: String(p.id ?? `p${i + 1}`),
        paso: Number(p.paso ?? i + 1),
        angulo: Number(p.angulo ?? 90),
        longitud: Number(p.longitud ?? 100),
        colision: Boolean(p.colision ?? false),
        fuerza: Number(p.fuerza ?? 0),
        tiempo: p.tiempo != null ? Number(p.tiempo) : undefined,
      }));
      setPlieguesProcesados(pliegues);
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
      const lineas = texto.split(/\r?\n/).map((l) => l.trim());
      const pliegues: PliegueProcesado[] = [];
      let paso = 1;

      for (let i = 0; i < lineas.length; i++) {
        if (lineas[i] === "LINE") {
          let x1: number | null = null;
          let x2: number | null = null;
          for (let j = i; j < Math.min(i + 40, lineas.length - 1); j++) {
            const code = lineas[j];
            const val = lineas[j + 1];
            if (code === "10") x1 = parseFloat(val);
            if (code === "11") x2 = parseFloat(val);
          }
          if (x1 != null && x2 != null) {
            const longitud = Math.abs(x2 - x1);
            if (longitud > 0.01) {
              pliegues.push({
                id: `p${paso}`,
                paso,
                angulo: 90,
                longitud,
                colision: false,
                fuerza: 0,
              });
              paso++;
            }
          }
        }
      }

      if (pliegues.length === 0) {
        alert("No se detectaron entidades LINE en el DXF.");
        return;
      }
      setPlieguesProcesados(pliegues);
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
