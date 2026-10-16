import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import BendCalculator from "@/components/BendCalculator";
import { getMaterialDefaultsByThickness } from "@/lib/bendCalc";
import type { CalculatorState } from "@/pages/Index";

const mocks = vi.hoisted(() => ({ resolve: vi.fn(), list: vi.fn(), error: vi.fn() }));
vi.mock("@/lib/storage", () => ({
  listMaterials: mocks.list,
  getMaterialDefaultsWithCalibration: mocks.resolve,
}));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));

beforeEach(() => {
  vi.clearAllMocks();
  HTMLElement.prototype.scrollIntoView = vi.fn();
  mocks.list.mockResolvedValue([{ material: "Acero" }, { material: "Galvanizado" }]);
  mocks.resolve.mockImplementation(async (material: string, thickness: number) => {
    const defaults = getMaterialDefaultsByThickness(material, thickness);
    return { defaults, calibrated: !!defaults };
  });
});
afterEach(cleanup);

const button = () => screen.getByRole("button", { name: "Calcular Plegado" }) as HTMLButtonElement;
const radius = (index = 1) => screen.getByRole("spinbutton", { name: `Radio interior plegado ${index}` }) as HTMLInputElement;
const k = (index = 1) => screen.getByRole("spinbutton", { name: `Factor K plegado ${index}` }) as HTMLInputElement;
const enter = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });
async function select(name: string, option: string) {
  fireEvent.click(screen.getByRole("combobox", { name }));
  fireEvent.click(await screen.findByRole("option", { name: option, exact: true }));
}
async function setup(thickness = "2 mm") {
  const calculate = vi.fn();
  render(<BendCalculator onCalculate={calculate} />);
  await select("Material", "Galvanizado");
  await select("Espesor", thickness);
  await waitFor(() => expect(screen.queryByText("Comprobando calibración…")).toBeNull());
  enter(screen.getByPlaceholderText("Ej: 500"), "100");
  return calculate;
}

describe("BendCalculator: procedencia manual de R/K", () => {
  it("renderiza sin defaults y usa los aprobados para Galvanizado 1 mm", async () => {
    const calculate = await setup("1 mm");
    await waitFor(() => expect(radius().value).toBe("1.5"));
    expect(k().value).toBe("0.38");
    expect(button().disabled).toBe(false);
    fireEvent.click(button());
    expect(calculate).toHaveBeenCalledTimes(1);
    expect(calculate.mock.calls[0][0].bends[0]).toMatchObject({ innerRadius: 1.5, kFactor: 0.38, bendAllowance: 2.95 });
    expect(calculate.mock.calls[0][0].totalDevelopedLength).toBe(102.95);
  });
  it("sin defaults exige R y K explícitos en cada pliegue y no copia el anterior", async () => {
    const calculate = await setup();
    expect(radius().value).toBe("");
    expect(k().value).toBe("");
    expect(radius().placeholder).toBe("");
    expect(button().disabled).toBe(true);
    enter(radius(), "1");
    expect(button().disabled).toBe(true);
    enter(k(), "0.4");
    expect(button().disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(radius(2).value).toBe("");
    expect(k(2).value).toBe("");
    expect(button().disabled).toBe(true);
    enter(radius(2), "2");
    enter(k(2), "0.3");
    fireEvent.click(button());
    expect(calculate).toHaveBeenCalledTimes(1);
    expect(calculate.mock.calls[0][0].bends).toMatchObject([
      { innerRadius: 1, kFactor: 0.4, bendAllowance: 2.83 },
      { innerRadius: 2, kFactor: 0.3, bendAllowance: 4.08 },
    ]);
    expect(calculate.mock.calls[0][0].totalDevelopedLength).toBe(106.91);
  });
  it.each([
    ["", "0.4"], ["1", ""], ["-1", "0.4"], ["1", "-0.1"], ["1", "0.51"],
  ])("bloquea R=%s / K=%s sin sustituirlos", async (r, factor) => {
    const calculate = await setup();
    enter(radius(), r);
    enter(k(), factor);
    expect(button().disabled).toBe(true);
    fireEvent.click(button());
    expect(calculate).not.toHaveBeenCalled();
  });
  it("acepta ceros explícitos sin convertirlos en ausencia", async () => {
    const calculate = await setup();
    enter(radius(), "0");
    enter(k(), "0");
    fireEvent.click(button());
    expect(calculate).toHaveBeenCalledTimes(1);
    expect(calculate.mock.calls[0][0].bends[0]).toMatchObject({ innerRadius: 0, kFactor: 0, bendAllowance: 0 });
  });
  it("cambiar espesor borra defaults y la procedencia manual anterior", async () => {
    const calculate = await setup("1 mm");
    enter(radius(), "3");
    enter(k(), "0.2");
    await select("Espesor", "2 mm");
    await waitFor(() => expect(screen.queryByText("Comprobando calibración…")).toBeNull());
    expect(radius().value).toBe("");
    expect(k().value).toBe("");
    expect(button().disabled).toBe(true);
    fireEvent.click(button());
    expect(calculate).not.toHaveBeenCalled();
    enter(radius(), "3");
    enter(k(), "0.2");
    fireEvent.click(button());
    expect(calculate).toHaveBeenCalledTimes(1);
  });
  it("cambiar material no convierte valores aprobados antiguos en manuales", async () => {
    await setup("1 mm");
    mocks.resolve.mockResolvedValue({ defaults: undefined, calibrated: false });
    await select("Material", "Acero");
    await waitFor(() => expect(screen.queryByText("Comprobando calibración…")).toBeNull());
    expect(radius().value).toBe("");
    expect(k().value).toBe("");
    expect(button().disabled).toBe(true);
  });
  it("cargar valores antiguos sin procedencia manual no habilita el cálculo", async () => {
    const state: CalculatorState = {
      material: "Galvanizado", thickness: 2, pieceLength: 100,
      bends: [{ angle: 90, distance: 50, innerRadius: 7, kFactor: 0.2, direction: 1, tolerance: 0.1 }],
    };
    const calculate = vi.fn();
    render(<BendCalculator onCalculate={calculate} initialState={state} />);
    await waitFor(() => expect(mocks.resolve).toHaveBeenCalledWith("Galvanizado", 2));
    await waitFor(() => expect(screen.queryByText("Comprobando calibración…")).toBeNull());
    expect(radius().value).toBe("");
    expect(k().value).toBe("");
    expect(button().disabled).toBe(true);
    expect(calculate).not.toHaveBeenCalled();
  });
  it("ignora una resolución tardía de otra combinación", async () => {
    let resolveOld: ((value: unknown) => void) | undefined;
    mocks.resolve.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
    const calculate = vi.fn();
    render(<BendCalculator onCalculate={calculate} />);
    await select("Material", "Galvanizado");
    await select("Espesor", "1 mm");
    await waitFor(() => expect(mocks.resolve).toHaveBeenCalledTimes(1));
    await select("Espesor", "2 mm");
    await waitFor(() => expect(screen.queryByText("Comprobando calibración…")).toBeNull());
    resolveOld?.({ defaults: { innerRadius: 9, kFactor: 0.1, bendAllowance90: 99 }, calibrated: true });
    await waitFor(() => expect(radius().value).toBe(""));
    expect(k().value).toBe("");
    expect(button().disabled).toBe(true);
  });
  it("captura un error de lectura y no permite calcular con datos desconocidos", async () => {
    mocks.resolve.mockRejectedValue(new Error("lectura fallida"));
    await setup();
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("No se pudo comprobar la calibración del material. Inténtalo de nuevo."));
    expect(button().disabled).toBe(true);
  });
});