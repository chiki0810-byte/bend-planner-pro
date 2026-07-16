// src/components/SheetSVGInteractive.tsx
// Visor 2D interactivo de pliegues (zoom, pan, hover y selección).
// Usa el motor de render (Módulo 20) y el motor de interacción (Módulo 21).

import React, { useEffect, useRef, useState } from "react";
import { renderPliegues2D } from "../lib/render2D";
import {
  conectarInteraccionSVG,
  crearEstadoInteraccion,
  transformacionSVG,
  EstadoInteraccion,
} from "../lib/interaccion2D";
import type { PliegueVisual } from "../lib/render2D";

interface SheetSVGInteractiveProps {
  pliegues: PliegueVisual[];
  onSeleccion?: (id: string | null) => void;
  onHover?: (id: string | null) => void;
  width?: number;
  height?: number;
}

const aplicarZoom = (elemento: HTMLElement, factor: number) => {
  const escalaActual = parseFloat(elemento.dataset.scale || "1");
  const nuevaEscala = Math.min(Math.max(escalaActual * factor, 0.5), 3);
  elemento.style.transform = `scale(${nuevaEscala})`;
  elemento.dataset.scale = nuevaEscala.toString();
};

const manejarPinch = (elemento: HTMLElement) => {
  let distanciaInicial = 0;

  elemento.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      distanciaInicial = Math.sqrt(dx * dx + dy * dy);
    }
  });

  elemento.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distanciaActual = Math.sqrt(dx * dx + dy * dy);
      if (distanciaInicial > 0) {
        const factor = distanciaActual / distanciaInicial;
        aplicarZoom(elemento, factor);
      }
    }
  });
};

export const SheetSVGInteractive: React.FC<SheetSVGInteractiveProps> = ({
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

  useEffect(() => {
    const { svg } = renderPliegues2D(pliegues, { width, height });
    const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    setSvgMarkup(inner);
  }, [pliegues, width, height]);

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

  useEffect(() => {
    const visor = document.getElementById("visor-chapa");
    if (visor) {
      visor.dataset.scale = "1";
      manejarPinch(visor);
    }
  }, []);

  return (
    <div id="visor-chapa" style={{ touchAction: "none" }}>
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
    </div>
  );
};

export default SheetSVGInteractive;
