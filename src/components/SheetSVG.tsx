// src/components/SheetSVG.tsx

import React, { useEffect, useRef, useState } from "react";
import { renderPliegues2D } from "../lib/render2D";
import {
  conectarInteraccionSVG,
  crearEstadoInteraccion,
  transformacionSVG,
  EstadoInteraccion,
} from "../lib/interaccion2D";
import type { PliegueVisual } from "../lib/render2D";

interface SheetSVGProps {
  pliegues: PliegueVisual[];
  onSeleccion?: (id: string | null) => void;
  onHover?: (id: string | null) => void;
  width?: number;
  height?: number;
}

export const SheetSVG: React.FC<SheetSVGProps> = ({
  pliegues,
  onSeleccion,
  onHover,
  width = 600,
  height = 400,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const estadoRef = useRef<EstadoInteraccion>(crearEstadoInteraccion());

  const [estado, setEstado] = useState<EstadoInteraccion>(estadoRef.current);
  const [svgMarkup, setSvgMarkup] = useState<string>("");

  // Render inicial y cada vez que cambien los pliegues
  useEffect(() => {
    const { svg } = renderPliegues2D(pliegues, { width, height });
    // Extraemos sólo el contenido interno del <svg> generado
    const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    setSvgMarkup(inner);
  }, [pliegues, width, height]);

  // Conexión de eventos de interacción
  useEffect(() => {
    if (!svgRef.current) return;

    const actualizarEstado = (nuevo: EstadoInteraccion) => {
      estadoRef.current = nuevo;
      setEstado(nuevo);
    };

    const cleanup = conectarInteraccionSVG(
      svgRef.current,
      pliegues,
      () => estadoRef.current,
      actualizarEstado,
      {
        onInteraccion: (evento) => {
          if (evento.tipo === "seleccion") {
            onSeleccion?.(evento.pliegueId ?? null);
          } else if (evento.tipo === "hover") {
            onHover?.(evento.pliegueId ?? null);
          }
        },
      }
    );

    return cleanup;
  }, [pliegues, onSeleccion, onHover]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{
        background: "hsl(var(--muted))",
        border: "1px solid hsl(var(--border))",
        borderRadius: 8,
        cursor: "grab",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <g
        transform={transformacionSVG(estado)}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    </svg>
  );
};

export default SheetSVG;
