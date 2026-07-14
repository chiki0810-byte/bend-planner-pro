import React, { useEffect, useState } from "react";

import { useSheetStore } from "../stores/sheetStore";

/**
 * Este componente NO reemplaza tu visor.
 * Solo añade una capa de animación sobre el pliegue actual.
 * Se integra dentro de SheetSVGInteractive.
 */

export const AnimacionPliegueSVG: React.FC = () => {

  const { plieguesProcesados, pasoActual } = useSheetStore();

  const [anguloAnimado, setAnguloAnimado] = useState(0);

  const pliegue = plieguesProcesados[pasoActual - 1];

  useEffect(() => {

    if (!pliegue) return;

    let frame = 0;

    const duracion = 30; // ~1 segundo

    const id = setInterval(() => {

      frame += 1;

      const progreso = frame / duracion;

      if (progreso >= 1) {

        setAnguloAnimado(pliegue.angulo);

        clearInterval(id);

      } else {

        setAnguloAnimado(pliegue.angulo * progreso);

      }

    }, 33);

    return () => clearInterval(id);

  }, [pasoActual]);

  if (!pliegue || !pliegue.x1 || !pliegue.y1 || !pliegue.x2 || !pliegue.y2) {

    return null;

  }

  // Punto de rotación = inicio del pliegue

  const cx = pliegue.x1;

  const cy = pliegue.y1;

  const linea = `M ${pliegue.x1} ${pliegue.y1} L ${pliegue.x2} ${pliegue.y2}`;

  return (

    <svg

      width="100%"

      height="100%"

      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}

    >

      <path

        d={linea}

        stroke="red"

        strokeWidth="3"

        transform={`rotate(${anguloAnimado}, ${cx}, ${cy})`}

      />

    </svg>

  );

};
