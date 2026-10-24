import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/storage", () => ({
  listMaterials: vi.fn(async () => [
    { material: "Acero", thickness: 1 },
    { material: "Titanio", thickness: 1 },
  ]),
  getMaterialDefaultsWithCalibration: vi.fn(async (material: string) => material === "Acero"
    ? { defaults: { bendAllowance90: 2.95, kFactor: 0.38, innerRadius: 1.5 }, calibrated: true }
    : { defaults: undefined, calibrated: false }),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import BendCalculator from "@/components/BendCalculator";
import { toast } from "sonner";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const originalScrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
  vi.unstubAllGlobals();
  Element.prototype.scrollIntoView = originalScrollIntoView;
});
afterEach(cleanup);

describe("BendCalculator calibration changes", () => {
  it("does not reuse loaded K/R when switching to a material without approved calibration", async () => {
    const onCalculate = vi.fn();
    render(
      <BendCalculator
        onCalculate={onCalculate}
        initialState={{
          material: "Acero",
          thickness: 1,
          pieceLength: 100,
          bends: [{
            angle: 90,
            distance: 40,
            innerRadius: 1.5,
            kFactor: 0.38,
            direction: 1,
            tolerance: 0.1,
          }],
        }}
      />,
    );

    await screen.findByText(/Defaults para Acero 1mm/);
    fireEvent.click(screen.getAllByRole("combobox")[1]);
    fireEvent.click(await screen.findByRole("option", { name: "Titanio" }));
    await screen.findByText(/pendiente de calibración/);
    fireEvent.click(screen.getByRole("button", { name: "Calcular Plegado" }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
      "No hay K/R aprobados para esta combinación. Introduce K y R válidos en cada pliegue.",
    ));
    expect(onCalculate).not.toHaveBeenCalled();
  });
});
