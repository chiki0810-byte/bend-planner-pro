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

type TabMovil = "pliegues" | "visor" | "estadisticas";

const useEsMovil = () => {
  const [esMovil, setEsMovil] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setEsMovil(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return esMovil;
};

export const ChapaLayout: React.FC = () => {
  const { plieguesProcesados, setPliegueSeleccionado } = useSheetStore();
  const esMovil = useEsMovil();
  const [tab, setTab] = React.useState<TabMovil>("pliegues");

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

  const panelSecuencia = <PanelSecuencia />;
  const visor = (
    <SheetSVGInteractive
      pliegues={pliegues}
      onSeleccion={(id) => setPliegueSeleccionado(id)}
    />
  );
  const panelDatos = (
    <>
      <PanelPliegue />
      <PanelEstadisticas />
    </>
  );
  const controles = (
    <>
      <PanelControl />
      <ExportarChapa />
      <ImportarChapa />
      <ValidacionChapa />
      <NormalizacionChapa />
      <SimulacionChapa />
      <SimulacionCompletaChapa />
      <MovimientoGlobalChapa />
    </>
  );

  if (esMovil) {
    const tabs: { id: TabMovil; label: string }[] = [
      { id: "pliegues", label: "Pliegues" },
      { id: "visor", label: "Visor" },
      { id: "estadisticas", label: "Estadísticas" },
    ];
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          width: "100%",
          maxWidth: "100vw",
          overflowX: "hidden",
          background: "#eaeaea",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#f7f7f7",
            borderBottom: "1px solid #ccc",
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 4px",
                fontSize: 13,
                fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? "#0b64d6" : "#444",
                background: tab === t.id ? "#fff" : "transparent",
                border: "none",
                borderBottom:
                  tab === t.id ? "2px solid #0b64d6" : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, width: "100%", overflowX: "hidden", overflowY: "auto" }}>
          {tab === "pliegues" && <div style={{ width: "100%" }}>{panelSecuencia}</div>}
          {tab === "visor" && (
            <div
              style={{
                width: "100%",
                height: "55vh",
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {visor}
            </div>
          )}
          {tab === "estadisticas" && (
            <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
              {panelDatos}
            </div>
          )}
        </div>

        <div
          style={{
            borderTop: "1px solid #ccc",
            background: "#f7f7f7",
            padding: "10px",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            width: "100%",
            overflowX: "hidden",
          }}
        >
          {controles}
        </div>
      </div>
    );
  }

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
        {panelSecuencia}
      </div>

      {/* Centro: visor interactivo */}
      <div
        style={{
          height: "calc(100vh - 180px)",
          width: "100%",
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {visor}
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
        {panelDatos}
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
        {controles}
      </div>
    </div>
  );
};


export default ChapaLayout;
