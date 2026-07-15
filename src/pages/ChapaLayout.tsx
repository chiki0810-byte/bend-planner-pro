// src/pages/ChapaLayout.tsx

import React, { useMemo } from "react";
import { PanelSecuencia } from "../components/PanelSecuencia";
import { PanelPliegue } from "../components/PanelPliegue";
import { PanelEstadisticas } from "../components/PanelEstadisticas";
import { PanelControl } from "../components/PanelControl";
import { SheetSVGInteractive } from "../components/SheetSVGInteractive";
import { ExportarChapa } from "../components/ExportarChapa";
import { ImportarChapa } from "../components/ImportarChapa";
import { ValidacionChapa } from "../components/ValidacionChapa";
import { NormalizacionChapa } from "../components/NormalizacionChapa";
import { SimulacionChapa } from "../components/SimulacionChapa";
import { SimulacionCompletaChapa } from "../components/SimulacionCompletaChapa";
import { MovimientoGlobalChapa } from "../components/MovimientoGlobalChapa";
import { useSheetStore } from "../stores/sheetStore";
import type { PliegueVisual } from "../lib/render2D";

export const ChapaLayout: React.FC = () => {
  const { plieguesProcesados, setPliegueSeleccionado } = useSheetStore();

  // Derivar geometría visual simple a partir de los pliegues procesados
  const pliegues: PliegueVisual[] = useMemo(() => {
    let x = 40;
    const y = 200;
    return [...plieguesProcesados]
      .sort((a, b) => a.paso - b.paso)
      .map((p) => {
        const inicio = { x, y };
        const fin = { x: x + p.longitud, y };
        x = fin.x + 10;
        return {
          id: p.id,
          inicio,
          fin,
          angulo: p.angulo,
        } as PliegueVisual;
      });
  }, [plieguesProcesados]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr 260px",
        gridTemplateRows: "1fr auto",
        height: "100vh",
        background: "#eaeaea",
      }}
    >
      {/* Panel izquierdo: Secuencia */}
      <div style={{ borderRight: "1px solid #ccc", overflow: "hidden" }}>
        <PanelSecuencia />
      </div>

      {/* Centro: visor interactivo */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
        }}
      >
        <SheetSVGInteractive
          pliegues={pliegues}
          onSeleccion={(id) => setPliegueSeleccionado(id)}
        />
      </div>

      {/* Panel derecho: datos + estadísticas */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderLeft: "1px solid #ccc",
          overflow: "auto",
        }}
      >
        <PanelPliegue />
        <PanelEstadisticas />
      </div>

      {/* Panel inferior: controles y utilidades */}
      <div
        style={{
          gridColumn: "1 / 4",
          borderTop: "1px solid #ccc",
          background: "#f7f7f7",
          padding: "12px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          overflow: "auto",
          maxHeight: "40vh",
        }}
      >
        <PanelControl />
        <ExportarChapa />
        <ImportarChapa />
        <ValidacionChapa />
        <NormalizacionChapa />
        <SimulacionChapa />
        <SimulacionCompletaChapa />
        <MovimientoGlobalChapa />
      </div>
    </div>
  );
};

export default ChapaLayout;
