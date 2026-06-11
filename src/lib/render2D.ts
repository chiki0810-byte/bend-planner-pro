// src/lib/render2D.ts

export interface Punto2D {
  x: number;
  y: number;
}

export interface PliegueVisual {
  id: string;
  inicio: Punto2D;
  fin: Punto2D;
  longitud: number;
  angulo: number;
  colisiona: boolean;
  paso: number;
}

export interface RenderOpciones {
  width?: number;
  height?: number;
  margen?: number;
  mostrarPasos?: boolean;
}

export interface RenderResultado {
  svg: string;
  viewBox: string;
}

/**
 * Escala automáticamente todos los puntos para que encajen en el viewport.
 */
function escalarPuntos(
  pliegues: PliegueVisual[],
  width: number,
  height: number,
  margen: number
): { plieguesEscalados: PliegueVisual[]; viewBox: string } {
  const xs = pliegues.flatMap(p => [p.inicio.x, p.fin.x]);
  const ys = pliegues.flatMap(p => [p.inicio.y, p.fin.y]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const ancho = maxX - minX || 1;
  const alto = maxY - minY || 1;

  const escala = Math.min(
    (width - margen * 2) / ancho,
    (height - margen * 2) / alto
  );

  const offsetX = margen - minX * escala;
  const offsetY = margen - minY * escala;

  const plieguesEscalados = pliegues.map(p => ({
    ...p,
    inicio: {
      x: p.inicio.x * escala + offsetX,
      y: p.inicio.y * escala + offsetY,
    },
    fin: {
      x: p.fin.x * escala + offsetX,
      y: p.fin.y * escala + offsetY,
    },
  }));

  return {
    plieguesEscalados,
    viewBox: `0 0 ${width} ${height}`,
  };
}

/**
 * Genera un SVG 2D de la pieza con sus pliegues.
 */
export function renderPieza2D(
  pliegues: PliegueVisual[],
  opciones: RenderOpciones = {}
): RenderResultado {
  const width = opciones.width ?? 600;
  const height = opciones.height ?? 400;
  const margen = opciones.margen ?? 30;
  const mostrarPasos = opciones.mostrarPasos ?? true;

  if (!pliegues || pliegues.length === 0) {
    const viewBox = `0 0 ${width} ${height}`;
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}"><text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#888" font-family="sans-serif" font-size="14">Sin pliegues</text></svg>`,
      viewBox,
    };
  }

  const { plieguesEscalados, viewBox } = escalarPuntos(pliegues, width, height, margen);

  const lineas = plieguesEscalados
    .map(p => {
      const color = p.colisiona ? "#dc2626" : "#2563eb";
      const grosor = p.colisiona ? 3 : 2;
      return `<line x1="${p.inicio.x.toFixed(2)}" y1="${p.inicio.y.toFixed(2)}" x2="${p.fin.x.toFixed(2)}" y2="${p.fin.y.toFixed(2)}" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round"/>`;
    })
    .join("");

  const etiquetas = mostrarPasos
    ? plieguesEscalados
        .map(p => {
          const cx = (p.inicio.x + p.fin.x) / 2;
          const cy = (p.inicio.y + p.fin.y) / 2;
          return `<g><circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="10" fill="#111827" /><text x="${cx.toFixed(2)}" y="${(cy + 4).toFixed(2)}" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="11" font-weight="bold">${p.paso}</text></g>`;
        })
        .join("")
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#f9fafb"/>${lineas}${etiquetas}</svg>`;

  return { svg, viewBox };
}

/**
 * Convierte la lista de pliegues de una pieza en geometría 2D
 * trazando segmentos consecutivos según el ángulo acumulado.
 */
export function plieguesAGeometria2D(
  pliegues: Array<{ longitud: number; angulo: number; direccion?: string }>,
  colisiones: number[] = []
): PliegueVisual[] {
  if (!pliegues || pliegues.length === 0) return [];

  const resultado: PliegueVisual[] = [];
  let x = 0;
  let y = 0;
  let anguloAcumulado = 0;

  pliegues.forEach((p, i) => {
    const rad = (anguloAcumulado * Math.PI) / 180;
    const x2 = x + Math.cos(rad) * p.longitud;
    const y2 = y + Math.sin(rad) * p.longitud;

    resultado.push({
      id: `pl-${i}`,
      inicio: { x, y },
      fin: { x: x2, y: y2 },
      longitud: p.longitud,
      angulo: p.angulo,
      colisiona: colisiones.includes(i),
      paso: i + 1,
    });

    x = x2;
    y = y2;
    const signo = p.direccion === "externa" ? -1 : 1;
    anguloAcumulado += signo * (180 - p.angulo);
  });

  return resultado;
}

// Alias: nombre alternativo usado por componentes de UI
export const renderPliegues2D = renderPieza2D;
