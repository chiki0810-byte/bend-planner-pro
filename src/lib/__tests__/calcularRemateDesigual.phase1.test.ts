import { describe, expect, it } from "vitest";
import { calcularRemateDesigual } from "@/lib/calcularRemateDesigual";

const inputBase = {
  longitudTotal: 80,
  alaA: 30,
  alaB: 50,
  espesor: 1,
  radio: 9,
  angulo: 90,
  material: "Acero",
  tipo: "normal" as const,
};

describe("calcularRemateDesigual con valores aprobados", () => {
  it("usa el K y el radio aprobados del material y espesor", () => {
    const resultado = calcularRemateDesigual({
      ...inputBase,
      pliegues: [{ angulo: 90, espesor: 1, radio: 0.1, k: 0.2 }],
    });

    expect(resultado.valido).toBe(true);
    expect(resultado.kFactor).toBe(0.38);
    expect(resultado.ba).toBe(2.953);
    expect(resultado.baPorPliegue).toEqual([2.953]);
  });

  it("rechaza una combinación sin K/R aprobados", () => {
    const resultado = calcularRemateDesigual({
      ...inputBase,
      espesor: 0.7,
      pliegues: [{ angulo: 90, espesor: 0.7, radio: 1, k: 0.33 }],
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.desarrolloTotal).toBe(0);
    expect(resultado.avisos[0].nivel).toBe("error");
    expect(resultado.avisos[0].mensaje).toMatch(/No hay K y radio aprobados válidos/);
  });

  it("usa la calibración cargada para el material y espesor", () => {
    const resultado = calcularRemateDesigual(
      {
        ...inputBase,
        pliegues: [{ angulo: 90, espesor: 1, radio: 0.1, k: 0.2 }],
      },
      () => ({ bendAllowance90: 4.27, kFactor: 0.22, innerRadius: 2.5 }),
    );

    expect(resultado.valido).toBe(true);
    expect(resultado.kFactor).toBe(0.22);
    expect(resultado.ba).toBe(4.273);
    expect(resultado.baPorPliegue).toEqual([4.273]);
  });

  it("rechaza una calibración guardada fuera de rango", () => {
    const resultado = calcularRemateDesigual(
      { ...inputBase, pliegues: [{ angulo: 90, espesor: 1, radio: 1, k: 0.4 }] },
      () => ({ bendAllowance90: 1, kFactor: 0.8, innerRadius: 1 }),
    );

    expect(resultado.valido).toBe(false);
    expect(resultado.desarrolloTotal).toBe(0);
    expect(resultado.avisos[0].mensaje).toMatch(/No hay K y radio aprobados válidos/);
  });

  it("rechaza tramos vacíos aunque las alas tengan longitud", () => {
    const resultado = calcularRemateDesigual({
      ...inputBase,
      sumaTramos: 80,
      tramos: [30, 0, 50],
      pliegues: [
        { angulo: 90, espesor: 1, radio: 1, k: 0.38 },
        { angulo: 90, espesor: 1, radio: 1, k: 0.38 },
      ],
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.desarrolloTotal).toBe(0);
    expect(resultado.avisos[0].mensaje).toMatch(/longitudes de los tramos/);
  });

  it("rechaza discrepancias entre longitud total y suma de tramos", () => {
    const resultado = calcularRemateDesigual({
      ...inputBase,
      longitudTotal: 80,
      sumaTramos: 81,
      tramos: [30, 1, 50],
      pliegues: [
        { angulo: 90, espesor: 1, radio: 1, k: 0.38 },
        { angulo: 90, espesor: 1, radio: 1, k: 0.38 },
      ],
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.avisos[0].mensaje).toMatch(/longitudes de los tramos/);
  });

  it("rechaza una cantidad de pliegues distinta de los intervalos entre tramos", () => {
    const resultado = calcularRemateDesigual({
      ...inputBase,
      longitudTotal: 90,
      sumaTramos: 90,
      tramos: [30, 10, 50],
      pliegues: [{ angulo: 90, espesor: 1, radio: 1, k: 0.38 }],
    });

    expect(resultado.valido).toBe(false);
    expect(resultado.desarrolloTotal).toBe(0);
    expect(resultado.avisos[0].mensaje).toMatch(/un pliegue entre cada par de tramos/);
  });

  it("rechaza ángulos mayores de 160 grados como fuera del rango plegable", () => {
    const resultado = calcularRemateDesigual({ ...inputBase, angulo: 161 });

    expect(resultado.valido).toBe(false);
    expect(resultado.desarrolloTotal).toBe(0);
    expect(resultado.avisos[0].mensaje).toMatch(/fuera del rango plegable/);
  });

  it("advierte para ángulos críticos permitidos sin invalidar su cálculo", () => {
    const resultado = calcularRemateDesigual({ ...inputBase, angulo: 150 });

    expect(resultado.valido).toBe(true);
    expect(resultado.avisos).toContainEqual(expect.objectContaining({
      nivel: "warn",
      mensaje: expect.stringMatching(/ángulo 150° crítico/),
    }));
  });

  it("invalida cejo sin una reducción de taller aprobada según espesor y geometría", () => {
    const resultado = calcularRemateDesigual({ ...inputBase, tipo: "cejo" });

    expect(resultado.valido).toBe(false);
    expect(resultado.reduccionCejo).toBe(0);
    expect(resultado.desarrolloTotal).toBe(0);
    expect(resultado.avisos[0]).toMatchObject({
      nivel: "error",
      mensaje: expect.stringMatching(/requiere una reducción de taller definida según espesor y geometría.*No se aplica el 5 % heredado ni se presenta el desarrollo como válido/),
    });
  });
});
