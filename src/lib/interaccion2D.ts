// src/lib/interaccion2D.ts

export interface Punto2D {
  x: number;
  y: number;
}

export interface EventoInteraccion {
  tipo: "zoom" | "pan" | "seleccion" | "hover";
  pliegueId?: string | null;
  escala?: number;
  desplazamiento?: { x: number; y: number };
}

export interface EstadoInteraccion {
  escala: number;
  offsetX: number;
  offsetY: number;
  pliegueSeleccionado: string | null;
  pliegueHover: string | null;
}

export interface InteraccionCallbacks {
  onInteraccion: (evento: EventoInteraccion) => void;
}

export interface PliegueVisual {
  id: string;
  inicio: Punto2D;
  fin: Punto2D;
}

/**
 * Estado inicial de la interacción 2D.
 */
export const estadoInicial: EstadoInteraccion = {
  escala: 1,
  offsetX: 0,
  offsetY: 0,
  pliegueSeleccionado: null,
  pliegueHover: null,
};

const ESCALA_MIN = 0.2;
const ESCALA_MAX = 8;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Aplica zoom relativo a un punto (por ejemplo, la posición del cursor).
 */
export function aplicarZoom(
  estado: EstadoInteraccion,
  factor: number,
  centro: Punto2D = { x: 0, y: 0 }
): EstadoInteraccion {
  const nuevaEscala = clamp(estado.escala * factor, ESCALA_MIN, ESCALA_MAX);
  const ratio = nuevaEscala / estado.escala;

  return {
    ...estado,
    escala: nuevaEscala,
    offsetX: centro.x - (centro.x - estado.offsetX) * ratio,
    offsetY: centro.y - (centro.y - estado.offsetY) * ratio,
  };
}

/**
 * Desplazamiento (pan) del lienzo.
 */
export function aplicarPan(
  estado: EstadoInteraccion,
  dx: number,
  dy: number
): EstadoInteraccion {
  return {
    ...estado,
    offsetX: estado.offsetX + dx,
    offsetY: estado.offsetY + dy,
  };
}

/**
 * Resetea el estado a su valor inicial.
 */
export function resetear(): EstadoInteraccion {
  return { ...estadoInicial };
}

/**
 * Convierte coordenadas de pantalla a coordenadas del lienzo (mundo).
 */
export function pantallaAMundo(
  punto: Punto2D,
  estado: EstadoInteraccion
): Punto2D {
  return {
    x: (punto.x - estado.offsetX) / estado.escala,
    y: (punto.y - estado.offsetY) / estado.escala,
  };
}

/**
 * Distancia mínima de un punto a un segmento.
 */
function distanciaPuntoSegmento(p: Punto2D, a: Punto2D, b: Punto2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const longSq = dx * dx + dy * dy;
  if (longSq === 0) {
    const ex = p.x - a.x;
    const ey = p.y - a.y;
    return Math.sqrt(ex * ex + ey * ey);
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / longSq;
  t = Math.max(0, Math.min(1, t));
  const px = a.x + t * dx;
  const py = a.y + t * dy;
  const ex = p.x - px;
  const ey = p.y - py;
  return Math.sqrt(ex * ex + ey * ey);
}

/**
 * Devuelve el pliegue más cercano al punto dado dentro de la tolerancia.
 */
export function detectarPliegueEn(
  punto: Punto2D,
  pliegues: PliegueVisual[],
  tolerancia: number = 8
): string | null {
  let mejor: { id: string; dist: number } | null = null;

  for (const p of pliegues) {
    const d = distanciaPuntoSegmento(punto, p.inicio, p.fin);
    if (d <= tolerancia && (!mejor || d < mejor.dist)) {
      mejor = { id: p.id, dist: d };
    }
  }

  return mejor ? mejor.id : null;
}

/**
 * Selecciona un pliegue (o limpia la selección con null).
 */
export function seleccionarPliegue(
  estado: EstadoInteraccion,
  pliegueId: string | null
): EstadoInteraccion {
  return { ...estado, pliegueSeleccionado: pliegueId };
}

/**
 * Marca el pliegue bajo el cursor.
 */
export function hoverPliegue(
  estado: EstadoInteraccion,
  pliegueId: string | null
): EstadoInteraccion {
  return { ...estado, pliegueHover: pliegueId };
}

/**
 * Construye la cadena `transform` para aplicar al `<g>` del SVG.
 */
export function transformacionSVG(estado: EstadoInteraccion): string {
  return `translate(${estado.offsetX} ${estado.offsetY}) scale(${estado.escala})`;
}

/**
 * Procesa un evento y devuelve el nuevo estado + notifica al callback.
 */
export function procesarEvento(
  estado: EstadoInteraccion,
  evento: EventoInteraccion,
  callbacks?: InteraccionCallbacks
): EstadoInteraccion {
  let nuevo = estado;

  switch (evento.tipo) {
    case "zoom":
      if (evento.escala !== undefined) {
        nuevo = aplicarZoom(estado, evento.escala);
      }
      break;
    case "pan":
      if (evento.desplazamiento) {
        nuevo = aplicarPan(estado, evento.desplazamiento.x, evento.desplazamiento.y);
      }
      break;
    case "seleccion":
      nuevo = seleccionarPliegue(estado, evento.pliegueId ?? null);
      break;
    case "hover":
      nuevo = hoverPliegue(estado, evento.pliegueId ?? null);
      break;
  }

  callbacks?.onInteraccion(evento);
  return nuevo;
}
