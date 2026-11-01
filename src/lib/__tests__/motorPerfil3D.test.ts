import { describe, it, expect } from "vitest";
import { calculateBendMath } from "../bendCalc";
import type { PiezaAbierta } from "../piezaAbierta";
import { generarSeccionPerfil, muestrearCara, tieneAutointerseccion, type ElementoCara, type Punto2D, type SeccionPerfil } from "../motorPerfil3D";

type P = { a: number; o: "up" | "down" };
const pieza = (cotas: number[], pl: P[], t = 1, R = 1.5, K = 0.38, ref: PiezaAbierta["dimensionReference"] = "tangent"): PiezaAbierta => ({
  id: "p",
  dimensionReference: ref,
  segmentos: cotas.map((c, i) => ({ id: `s${i}`, cota: c })),
  pliegues: pl.map((p, i) => ({ id: `b${i}`, anguloGrados: p.a, orientacion: p.o, segmentoAnteriorId: `s${i}`, segmentoSiguienteId: `s${i + 1}` })),
  parametrosMaterial: { material: "Acero", espesor: t, kFactor: K, radioInterior: R },
  desarrolloTeorico: null,
  correccionesTaller: [],
});

const ok = (p: PiezaAbierta): SeccionPerfil => {
  const r = generarSeccionPerfil(p);
  if (!r.ok) throw new Error(JSON.stringify(r.errores));
  return r.seccion;
};
const dist = (a: Punto2D, b: Punto2D) => Math.hypot(a.x - b.x, a.y - b.y);
const dirFinal = (cara: ElementoCara[]) => {
  const e = cara[cara.length - 1];
  return Math.atan2(e.hasta.y - e.desde.y, e.hasta.x - e.desde.x);
};

function comprobarInvariantes(s: SeccionPerfil) {
  for (const cara of [s.caraA, s.caraB]) {
    for (let i = 1; i < cara.length; i++) expect(dist(cara[i - 1].hasta, cara[i].desde)).toBeLessThan(1e-9);
  }
  // espesor constante en extremos de cada elemento
  s.caraA.forEach((ea, i) => {
    const eb = s.caraB[i];
    if (ea.tipo === "recta") {
      expect(dist(ea.desde, eb.desde)).toBeCloseTo(s.espesor, 9);
      expect(dist(ea.hasta, eb.hasta)).toBeCloseTo(s.espesor, 9);
    } else if (eb.tipo === "arco") {
      expect(Math.abs(ea.radio - eb.radio)).toBeCloseTo(s.espesor, 9);
      expect(dist(ea.centro, eb.centro)).toBeLessThan(1e-9);
    }
  });
  expect(tieneAutointerseccion(s)).toBe(false);
}

const devEsperado = (cotas: number[], pl: P[], t: number, R: number, K: number) =>
  cotas.reduce((a, b) => a + b, 0) + pl.reduce((a, p) => a + calculateBendMath({ angle: p.a, innerRadius: R, kFactor: K, thickness: t }).bendAllowance, 0);

const CASOS: { nombre: string; cotas: number[]; pl: P[]; t: number; R: number; K: number; dirDeg: number }[] = [
  { nombre: "recto", cotas: [100], pl: [], t: 1, R: 1.5, K: 0.38, dirDeg: 0 },
  { nombre: "L 90°", cotas: [50, 30], pl: [{ a: 90, o: "up" }], t: 1, R: 1.5, K: 0.38, dirDeg: 90 },
  { nombre: "U", cotas: [40, 60, 40], pl: [{ a: 90, o: "up" }, { a: 90, o: "up" }], t: 0.8, R: 1.2, K: 0.35, dirDeg: 180 },
  { nombre: "Z alterno", cotas: [30, 50, 30], pl: [{ a: 90, o: "up" }, { a: 90, o: "down" }], t: 1.2, R: 1.8, K: 0.4, dirDeg: 0 },
  { nombre: "agudo 135°", cotas: [50, 50], pl: [{ a: 135, o: "down" }], t: 1.5, R: 2.2, K: 0.42, dirDeg: -135 },
  { nombre: "obtuso 30°", cotas: [50, 50], pl: [{ a: 30, o: "up" }], t: 0.5, R: 0.8, K: 0.33, dirDeg: 30 },
  { nombre: "radio 0", cotas: [20, 20], pl: [{ a: 90, o: "down" }], t: 1, R: 0, K: 0.38, dirDeg: -90 },
  { nombre: "55/45/40/460 alterno", cotas: [55, 45, 40, 460], pl: [{ a: 90, o: "up" }, { a: 90, o: "down" }, { a: 45, o: "up" }], t: 0.6, R: 1, K: 0.33, dirDeg: 45 },
];

describe("motorPerfil3D — sección 2D continua (referencia tangent)", () => {
  for (const c of CASOS) {
    it(`${c.nombre}: continuidad, espesor, sin solapes, dirección y desarrollo`, () => {
      const s = ok(pieza(c.cotas, c.pl, c.t, c.R, c.K));
      comprobarInvariantes(s);
      expect(s.caraA).toHaveLength(c.cotas.length + c.pl.length);
      expect(dirFinal(s.caraB) * 180 / Math.PI).toBeCloseTo(c.dirDeg > 180 ? c.dirDeg - 360 : c.dirDeg === 180 ? (dirFinal(s.caraB) > 0 ? 180 : -180) : c.dirDeg, 6);
      expect(s.desarrolloTeorico).toBeCloseTo(devEsperado(c.cotas, c.pl, c.t, c.R, c.K), 9);
    });
  }

  it("L 90° up: geometría exacta de la cara exterior", () => {
    const s = ok(pieza([50, 30], [{ a: 90, o: "up" }], 1, 1.5, 0.38));
    // cara B exterior radio R+t=2.5, centro (50, 2.5)
    const arco = s.caraB[1];
    expect(arco.tipo).toBe("arco");
    if (arco.tipo === "arco") {
      expect(arco.radio).toBeCloseTo(2.5, 12);
      expect(arco.centro.x).toBeCloseTo(50, 12);
      expect(arco.centro.y).toBeCloseTo(2.5, 12);
    }
    expect(s.caraB[2].hasta.x).toBeCloseTo(52.5, 12);
    expect(s.caraB[2].hasta.y).toBeCloseTo(32.5, 12);
    expect(s.pliegues[0].caraInterior).toBe("A");
  });

  it("pliegue alterno cambia la cara interior", () => {
    const s = ok(pieza([30, 50, 30], [{ a: 90, o: "up" }, { a: 90, o: "down" }]));
    expect(s.pliegues.map((p) => p.caraInterior)).toEqual(["A", "B"]);
  });

  it("BA viene de calculateBendMath, no de una fórmula duplicada", () => {
    const s = ok(pieza([50, 30], [{ a: 90, o: "up" }], 1.2, 1.8, 0.4));
    expect(s.pliegues[0].ba).toBe(calculateBendMath({ angle: 90, innerRadius: 1.8, kFactor: 0.4, thickness: 1.2 }).bendAllowance);
  });

  it("muestreo de arcos permanece a distancia radio del centro", () => {
    const s = ok(pieza([50, 30], [{ a: 120, o: "down" }], 1, 3, 0.38));
    const arco = s.caraA[1];
    if (arco.tipo !== "arco") throw new Error();
    muestrearCara([arco]).forEach((p) => expect(dist(p, arco.centro)).toBeCloseTo(arco.radio, 9));
  });
});

describe("motorPerfil3D — rechazos sin inventar valores", () => {
  it.each(["inside", "outside"] as const)("referencia %s no soportada (sin OSSB automático)", (ref) => {
    const r = generarSeccionPerfil(pieza([50, 30], [{ a: 90, o: "up" }], 1, 1.5, 0.38, ref));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores[0].codigo).toBe("REFERENCIA_NO_SOPORTADA");
  });

  it("sin parámetros de material no calcula", () => {
    const p = pieza([50], []);
    delete p.parametrosMaterial;
    const r = generarSeccionPerfil(p);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores[0].codigo).toBe("SIN_PARAMETROS_MATERIAL");
  });

  it("estructura inválida (N segmentos ≠ N-1 pliegues)", () => {
    const p = pieza([50, 30], [{ a: 90, o: "up" }]);
    p.pliegues = [];
    const r = generarSeccionPerfil(p);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores[0].codigo).toBe("ESTRUCTURA_INVALIDA");
  });

  it.each([
    ["espesor 0", pieza([50], [], 0), "PARAMETRO_INVALIDO"],
    ["radio negativo", pieza([50], [], 1, -1), "PARAMETRO_INVALIDO"],
    ["K > 0.5", pieza([50], [], 1, 1, 0.6), "PARAMETRO_INVALIDO"],
    ["cota 0", pieza([0], []), "COTA_NO_POSITIVA"],
    ["ángulo 0", pieza([50, 30], [{ a: 0, o: "up" }]), "ANGULO_FUERA_DE_RANGO"],
    ["ángulo 200", pieza([50, 30], [{ a: 200, o: "up" }]), "ANGULO_FUERA_DE_RANGO"],
  ])("%s → error", (_n, p, codigo) => {
    const r = generarSeccionPerfil(p as PiezaAbierta);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores.map((e) => e.codigo)).toContain(codigo);
  });

  it("alas que colisionan se detectan como autointersección", () => {
    // ala de retorno larga tras dos pliegues agudos: cruza el primer tramo
    const r = generarSeccionPerfil(pieza([50, 10, 80], [{ a: 170, o: "up" }, { a: 120, o: "up" }]));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errores[0].codigo).toBe("AUTOINTERSECCION");
  });
});
