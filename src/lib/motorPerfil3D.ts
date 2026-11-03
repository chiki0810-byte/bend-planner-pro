// ---------------------------------------------------------
// MOTOR DE PERFIL — FASE 1: geometría continua 2D (sección)
// ---------------------------------------------------------
// Motor matemático puro, sin dependencias visuales. No modifica
// geometriaPlegado.ts ni ningún cálculo industrial validado.
//
// CONVENCIONES (explícitas, no inferidas)
// - anguloGrados = ángulo de DEFLEXIÓN del pliegue (0° = recto, 90° = escuadra),
//   el mismo que recibe calculateBendMath (BA = θrad·(R + K·t)).
// - orientacion "up" = giro antihorario (izquierda) visto en la sección;
//   "down" = giro horario. Se recorre la pieza desde el primer segmento.
// - Cara B = cara de referencia (derecha según avance); cara A = cara B
//   desplazada t hacia la izquierda.
//
// RESOLUCIÓN DE COTAS (solo se resuelve lo demostrable)
// - "tangent": la cota es la longitud del tramo recto entre líneas de
//   tangencia. El tramo recto es idéntico en ambas caras y en la fibra
//   neutra, así que su longitud plana = cota sin transformación.
//   Desarrollo = Σcotas + ΣBA (BA de calculateBendMath). No se usa OSSB.
// - "inside" / "outside": NO SOPORTADAS en esta fase. Restar
//   tan(θ/2)·R (interior) u OSSB = tan(θ/2)·(R+t) (exterior) solo es
//   correcto si la cota termina en la intersección de líneas de molde;
//   el modelo no demuestra dónde termina cada cota, y en un pliegue
//   alterno ("up" seguido de "down") la cara interior cambia de lado.
//   Se devuelve error REFERENCIA_NO_SOPORTADA, sin aproximar.
//
// GARANTÍAS GEOMÉTRICAS
// - Continuidad: cada elemento empieza exactamente donde acaba el anterior
//   (se encadena por construcción; las pruebas lo verifican).
// - Espesor: arcos concéntricos con radios R y R+t, y rectas desplazadas t
//   según la normal ⇒ separación t en todo punto.
// - Sin huecos/solapes: el contorno cerrado (cara B, tapa final, cara A
//   inversa, tapa inicial) se comprueba contra autointersecciones.
// - El sólido 3D (extrusión) y la simulación progresiva NO pertenecen a esta
//   fase; consumirán esta sección sin recalcularla.
// ---------------------------------------------------------

import { calculateBendMath } from "./bendCalc";
import { validarEstructuraPiezaAbierta, type PiezaAbierta } from "./piezaAbierta";

export interface Punto2D { x: number; y: number }

export type ElementoCara =
  | { tipo: "recta"; desde: Punto2D; hasta: Punto2D }
  | {
      tipo: "arco";
      centro: Punto2D;
      radio: number;
      anguloInicio: number; // rad, posición angular del punto inicial respecto al centro
      barrido: number;      // rad, con signo (+ antihorario)
      desde: Punto2D;
      hasta: Punto2D;
    };

export interface DetallePliegue {
  id: string;
  anguloGrados: number;
  orientacion: "up" | "down";
  radioInterior: number;
  ba: number;
  caraInterior: "A" | "B";
}

export interface SeccionPerfil {
  espesor: number;
  caraA: ElementoCara[];
  caraB: ElementoCara[];
  pliegues: DetallePliegue[];
  /** Desarrollo teórico = Σcotas + ΣBA (referencia tangent). */
  desarrolloTeorico: number;
}

export type CodigoErrorMotor =
  | "ESTRUCTURA_INVALIDA"
  | "SIN_PARAMETROS_MATERIAL"
  | "PARAMETRO_INVALIDO"
  | "REFERENCIA_NO_SOPORTADA"
  | "COTA_NO_POSITIVA"
  | "ANGULO_FUERA_DE_RANGO"
  | "AUTOINTERSECCION";

export interface ErrorMotor { codigo: CodigoErrorMotor; mensaje: string; id?: string }

export type ResultadoSeccion =
  | { ok: true; seccion: SeccionPerfil }
  | { ok: false; errores: ErrorMotor[] };

const fin = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const sumar = (p: Punto2D, d: Punto2D, k: number): Punto2D => ({ x: p.x + d.x * k, y: p.y + d.y * k });

export function generarSeccionPerfil(pieza: PiezaAbierta): ResultadoSeccion {
  const estructura = validarEstructuraPiezaAbierta(pieza);
  if (!estructura.valida) {
    return {
      ok: false,
      errores: estructura.errores.map((e) => ({ codigo: "ESTRUCTURA_INVALIDA" as const, mensaje: e.mensaje, id: e.id })),
    };
  }
  if (pieza.dimensionReference !== "tangent") {
    return {
      ok: false,
      errores: [{
        codigo: "REFERENCIA_NO_SOPORTADA",
        mensaje: `Referencia "${pieza.dimensionReference}" no soportada en Fase 1: su transformación a tramos rectos no está demostrada.`,
      }],
    };
  }
  const pm = pieza.parametrosMaterial;
  if (!pm) {
    return { ok: false, errores: [{ codigo: "SIN_PARAMETROS_MATERIAL", mensaje: "Faltan material, espesor, K y radio interior explícitos." }] };
  }
  const errores: ErrorMotor[] = [];
  if (!fin(pm.espesor) || pm.espesor <= 0) errores.push({ codigo: "PARAMETRO_INVALIDO", mensaje: "Espesor debe ser > 0." });
  if (!fin(pm.radioInterior) || pm.radioInterior < 0) errores.push({ codigo: "PARAMETRO_INVALIDO", mensaje: "Radio interior debe ser ≥ 0." });
  if (!fin(pm.kFactor) || pm.kFactor < 0 || pm.kFactor > 0.5) errores.push({ codigo: "PARAMETRO_INVALIDO", mensaje: "K debe estar entre 0 y 0.5." });
  pieza.segmentos.forEach((s) => {
    if (!(s.cota > 0)) errores.push({ codigo: "COTA_NO_POSITIVA", mensaje: `Segmento ${s.id}: cota debe ser > 0.`, id: s.id });
  });
  pieza.pliegues.forEach((p) => {
    if (!(p.anguloGrados > 0 && p.anguloGrados <= 180)) {
      errores.push({ codigo: "ANGULO_FUERA_DE_RANGO", mensaje: `Pliegue ${p.id}: ángulo debe estar en (0, 180].`, id: p.id });
    }
  });
  if (errores.length) return { ok: false, errores };

  const t = pm.espesor;
  const R = pm.radioInterior;
  const caraA: ElementoCara[] = [];
  const caraB: ElementoCara[] = [];
  const detalles: DetallePliegue[] = [];

  let pB: Punto2D = { x: 0, y: 0 };
  let dir = 0; // rad
  let desarrollo = 0;

  pieza.segmentos.forEach((seg, i) => {
    const d = { x: Math.cos(dir), y: Math.sin(dir) };
    const n = { x: -d.y, y: d.x }; // normal izquierda
    const pA = sumar(pB, n, t);
    const fB = sumar(pB, d, seg.cota);
    const fA = sumar(pA, d, seg.cota);
    caraB.push({ tipo: "recta", desde: pB, hasta: fB });
    caraA.push({ tipo: "recta", desde: pA, hasta: fA });
    desarrollo += seg.cota;
    pB = fB;

    const pl = pieza.pliegues[i];
    if (!pl) return;
    const theta = (Math.PI / 180) * pl.anguloGrados;
    const s = pl.orientacion === "up" ? 1 : -1;
    // up: centro a la izquierda, cara A interior (R), cara B exterior (R+t)
    // down: centro a la derecha, cara B interior (R), cara A exterior (R+t)
    const centro = s === 1 ? sumar(fB, n, R + t) : sumar(fB, n, -R);
    const rB = s === 1 ? R + t : R;
    const rA = s === 1 ? R : R + t;
    const arco = (desde: Punto2D, radio: number): ElementoCara => {
      const a0 = Math.atan2(desde.y - centro.y, desde.x - centro.x);
      const a1 = a0 + s * theta;
      const hasta = radio === 0 ? { ...centro } : { x: centro.x + radio * Math.cos(a1), y: centro.y + radio * Math.sin(a1) };
      return { tipo: "arco", centro, radio, anguloInicio: radio === 0 ? dir - s * Math.PI / 2 : a0, barrido: s * theta, desde, hasta };
    };
    const arcoB = arco(fB, rB);
    const arcoA = arco(fA, rA);
    caraB.push(arcoB);
    caraA.push(arcoA);
    const { bendAllowance } = calculateBendMath({ angle: pl.anguloGrados, innerRadius: R, kFactor: pm.kFactor, thickness: t });
    desarrollo += bendAllowance;
    detalles.push({ id: pl.id, anguloGrados: pl.anguloGrados, orientacion: pl.orientacion, radioInterior: R, ba: bendAllowance, caraInterior: s === 1 ? "A" : "B" });
    dir += s * theta;
    pB = arcoB.hasta;
  });

  const seccion: SeccionPerfil = { espesor: t, caraA, caraB, pliegues: detalles, desarrolloTeorico: desarrollo };
  if (tieneAutointerseccion(seccion)) {
    return { ok: false, errores: [{ codigo: "AUTOINTERSECCION", mensaje: "La sección se solapa consigo misma (alas en colisión)." }] };
  }
  return { ok: true, seccion };
}

/** Discretiza una cara en una polilínea (los extremos son exactos). */
export function muestrearCara(cara: ElementoCara[], pasosPorRadian = 24): Punto2D[] {
  const pts: Punto2D[] = [];
  for (const e of cara) {
    if (pts.length === 0) pts.push(e.desde);
    if (e.tipo === "recta" || e.radio === 0) {
      pts.push(e.hasta);
      continue;
    }
    const n = Math.max(2, Math.ceil(Math.abs(e.barrido) * pasosPorRadian));
    for (let k = 1; k < n; k++) {
      const a = e.anguloInicio + (e.barrido * k) / n;
      pts.push({ x: e.centro.x + e.radio * Math.cos(a), y: e.centro.y + e.radio * Math.sin(a) });
    }
    pts.push(e.hasta);
  }
  return pts;
}

/** Contorno cerrado: cara B → tapa final → cara A inversa → tapa inicial. */
export function contornoCerrado(seccion: SeccionPerfil): Punto2D[] {
  const b = muestrearCara(seccion.caraB);
  const a = muestrearCara(seccion.caraA).reverse();
  return [...b, ...a];
}

const cruzan = (p1: Punto2D, p2: Punto2D, p3: Punto2D, p4: Punto2D): boolean => {
  const o = (a: Punto2D, b: Punto2D, c: Punto2D) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const eps = 1e-9;
  const d1 = o(p3, p4, p1), d2 = o(p3, p4, p2), d3 = o(p1, p2, p3), d4 = o(p1, p2, p4);
  return ((d1 > eps && d2 < -eps) || (d1 < -eps && d2 > eps)) && ((d3 > eps && d4 < -eps) || (d3 < -eps && d4 > eps));
};

export function tieneAutointerseccion(seccion: SeccionPerfil): boolean {
  const pts = contornoCerrado(seccion).filter(
    (p, i, arr) => i === 0 || Math.hypot(p.x - arr[i - 1].x, p.y - arr[i - 1].y) > 1e-9,
  );
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a1 = pts[i], a2 = pts[(i + 1) % n];
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // adyacentes por cierre
      if (cruzan(a1, a2, pts[j], pts[(j + 1) % n])) return true;
    }
  }
  return false;
}
