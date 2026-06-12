import React from "react";
import { useSheetStore } from "../stores/sheetStore";

interface PanelEstadisticasProps {
  ancho?: number;
}

export const PanelEstadisticas: React.FC<PanelEstadisticasProps> = ({
  ancho = 260
}) => {
  const { plieguesProcesados } = useSheetStore();

  const totalPliegues = plieguesProcesados.length;
  const totalFuerza = plieguesProcesados.reduce((s, p) => s + p.fuerza, 0);
  const totalTiempo = plieguesProcesados.reduce(
    (s, p) => s + (p.tiempo ?? 0),
    0
  );
  const totalLongitud = plieguesProcesados.reduce((s, p) => s + p.longitud, 0);
  const totalColisiones = plieguesProcesados.filter(p => p.colision).length;

  const angulosCriticos = plieguesProcesados.filter(p => p.angulo > 120);

  return (
    <div
      style={{
        width: ancho,
        padding: "16px",
        background: "#fafafa",
        borderLeft: "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}
    >
      <h3>Estadísticas globales</h3>

      <div>
        <strong>Total de pliegues:</strong> {totalPliegues}
      </div>

      <div>
        <strong>Fuerza total:</strong> {totalFuerza.toFixed(1)} kN
      </div>

      <div>
        <strong>Tiempo total:</strong> {totalTiempo.toFixed(2)} s
      </div>

      <div>
        <strong>Longitud total plegada:</strong> {totalLongitud.toFixed(1)} mm
      </div>

      <div>
        <strong>Colisiones detectadas:</strong>{" "}
        <span style={{ color: totalColisiones > 0 ? "#c00" : "#090" }}>
          {totalColisiones}
        </span>
      </div>

      <div>
        <strong>Ángulos críticos (&gt;120°):</strong> {angulosCriticos.length}
      </div>

      {angulosCriticos.length > 0 && (
        <div style={{ fontSize: "13px", color: "#c00" }}>
          {angulosCriticos.map(p => (
            <div key={p.id}>
              Pliegue {p.id}: {p.angulo.toFixed(1)}°
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
