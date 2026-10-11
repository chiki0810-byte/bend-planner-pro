import { describe, it, expect } from "vitest";
import {
  validarEstructuraPiezaAbierta,
  DIMENSION_REFERENCES,
  type PiezaAbierta,
} from "@/lib/piezaAbierta";

const pieza = (over: Partial<PiezaAbierta> = {}): PiezaAbierta => ({
  id: "X",
  dimensionReference: "inside",
  segmentos: [
    { id: "S1", cota: 55 },
    { id: "S2", cota: 45 },
    { id: "S3", cota: 40 },
    { id: "S4", cota: 460 },
  ],
  pliegues: [
    { id: "P1", anguloGrados: 90, orientacion: "up", segmentoAnteriorId: "S1", segmentoSiguienteId: "S2" },
    { id: "P2", anguloGrados: 90, orientacion: "down", segmentoAnteriorId: "S2", segmentoSiguienteId: "S3" },
    { id: "P3", anguloGrados: 135, orientacion: "up", segmentoAnteriorId: "S3", segmentoSiguienteId: "S4" },
  ],
  desarrolloTeorico: null,
  correccionesTaller: [],
  ...over,
});
const codigos = (p: PiezaAbierta) => validarEstructuraPiezaAbierta(p).errores.map((e) => e.codigo);

describe("piezaAbierta — contrato de estructura", () => {
  it("4 segmentos + 3 pliegues bien enlazados es válida; último segmento explícito", () => {
    const p = pieza();
    expect(validarEstructuraPiezaAbierta(p)).toEqual({ valida: true, errores: [] });
    expect(p.segmentos.at(-1)!.id).toBe("S4");
    expect(p.pliegues.some((x) => x.segmentoAnteriorId === "S4")).toBe(false);
  });

  it("un único segmento sin pliegues es válido", () => {
    expect(codigos(pieza({ segmentos: [{ id: "S1", cota: 100 }], pliegues: [] }))).toEqual([]);
  });

  it("N segmentos con N pliegues (modelo fusionado) es inválido", () => {
    const p = pieza();
    p.pliegues.push({ id: "P4", anguloGrados: 90, orientacion: "up", segmentoAnteriorId: "S4", segmentoSiguienteId: "S5" });
    expect(codigos(p)).toContain("NUMERO_PLIEGUES");
  });

  it("sin segmentos es inválido", () => {
    expect(codigos(pieza({ segmentos: [], pliegues: [] }))).toEqual(["SIN_SEGMENTOS"]);
  });

  it("segmentos y pliegues no pueden ser la misma colección", () => {
    const shared: any[] = [];
    expect(codigos(pieza({ segmentos: shared, pliegues: shared }))).toContain("COLECCIONES_COMPARTIDAS");
  });

  it("referencias admitidas: solo inside | outside | tangent", () => {
    expect([...DIMENSION_REFERENCES]).toEqual(["inside", "outside", "tangent"]);
  });

  it("la pieza 55/45/40/460 lleva una única referencia dimensional explícita", () => {
    const p = pieza();
    expect(p.dimensionReference).toBe("inside");
    expect(p.segmentos.every((s) => !("referencia" in s))).toBe(true);
    expect(validarEstructuraPiezaAbierta(p).valida).toBe(true);
  });

  it("referencia ausente a nivel de pieza es error y no se infiere", () => {
    const p = pieza();
    delete (p as { dimensionReference?: unknown }).dimensionReference;
    expect(codigos(p as PiezaAbierta)).toEqual(["REFERENCIA_AUSENTE"]);
  });

  it("referencia no admitida a nivel de pieza es error", () => {
    const p = pieza({ dimensionReference: "neutral" as any });
    expect(codigos(p)).toEqual(["REFERENCIA_INVALIDA"]);
  });

  it("los segmentos ya no llevan referencia: una referencia residual por segmento no se valida ni se infiere", () => {
    const p = pieza();
    (p.segmentos[0] as any).referencia = "neutral";
    expect(validarEstructuraPiezaAbierta(p)).toEqual({ valida: true, errores: [] });
  });

  it("enlaces de pliegue incorrectos se detectan", () => {
    const p = pieza();
    p.pliegues[1].segmentoSiguienteId = "S4";
    expect(codigos(p)).toEqual(["ENLACE_INCORRECTO"]);
  });

  it("ids duplicados, cota y ángulo no numéricos, orientación inválida", () => {
    const p = pieza();
    p.segmentos[1].id = "S1";
    p.segmentos[2].cota = NaN;
    p.pliegues[0].anguloGrados = Number.POSITIVE_INFINITY;
    (p.pliegues[2] as any).orientacion = "left";
    const c = codigos(p);
    for (const k of ["ID_DUPLICADO", "COTA_INVALIDA", "ANGULO_INVALIDO", "ORIENTACION_INVALIDA"]) expect(c).toContain(k);
  });

  it("no añade material/K/radio ni desarrollo ni correcciones; no muta la pieza", () => {
    const p = pieza();
    const copia = structuredClone(p);
    validarEstructuraPiezaAbierta(p);
    expect(p).toEqual(copia);
    expect(p.parametrosMaterial).toBeUndefined();
    expect(p.desarrolloTeorico).toBeNull();
    expect(p.correccionesTaller).toEqual([]);
  });
});
