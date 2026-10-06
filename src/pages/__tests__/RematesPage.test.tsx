import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { RematesProvider } from "@/state/RematesContext";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/rematesExport", () => ({
  exportRemateExcel: vi.fn(),
  exportRematePdf: vi.fn(async () => {}),
}));

import { toast } from "sonner";
import { getMaterialDefaultsByThickness } from "@/lib/bendCalc";
import RematesPage from "@/pages/RematesPage";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

afterEach(() => cleanup());

// En modo recto (por defecto) los inputs con placeholder "0" son, en orden DOM:
// [Medida derecha, Medida izquierda, Espesor, Solape]
const setInput = (index: number, v: string) => {
  const inputs = screen.getAllByPlaceholderText("0");
  fireEvent.change(inputs[index], { target: { value: v } });
};

const renderPage = () =>
  render(
    <RematesProvider>
      <RematesPage />
    </RematesProvider>,
  );

describe("RematesPage — K vía motor central Fase 1", () => {
  it("regla central: Acero 0.8 => K=0.35 y Acero 1.0 => K=0.38 (motor bendCalc)", () => {
    expect(getMaterialDefaultsByThickness("Acero", 0.8)!.kFactor).toBe(0.35);
    expect(getMaterialDefaultsByThickness("Acero", 1.0)!.kFactor).toBe(0.38);
  });

  it("Acero 0.8 calcula con K=0.35 manteniendo la fórmula 2·π·K·t", async () => {
    renderPage(); // material por defecto: Acero, tipo: recto
    setInput(0, "100"); // medida derecha
    setInput(1, "50"); // medida izquierda
    setInput(2, "0.8"); // espesor
    setInput(3, "5"); // solape
    fireEvent.click(screen.getByRole("button", { name: /calcular remate/i }));

    const corr = 2 * Math.PI * 0.35 * 0.8; // 1.7593
    const derecha = 100 + corr; // 101.7593
    const izquierda = 50 + corr; // 51.7593
    const total = derecha + izquierda + 5; // 158.5186

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        `Desarrollo total: ${total.toFixed(2)} mm`,
      ),
    );
    console.log("CARD", screen.getByText("Resultados").parentElement?.textContent);
    expect(screen.getByText(new RegExp(`^${derecha.toFixed(2)} mm$`))).toBeTruthy();
    expect(screen.getByText(new RegExp(`^${izquierda.toFixed(2)} mm$`))).toBeTruthy();
    expect(screen.getByText(new RegExp(`^${total.toFixed(2)} mm$`))).toBeTruthy();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("Acero 1.0 calcula con K=0.38 (corr = 2·π·0.38·1.0)", async () => {
    renderPage();
    setInput(0, "100"); // medida derecha
    setInput(1, "0"); // medida izquierda
    setInput(2, "1.0"); // espesor
    setInput(3, "0"); // solape
    fireEvent.click(screen.getByRole("button", { name: /calcular remate/i }));

    const corr = 2 * Math.PI * 0.38 * 1.0; // 2.3876
    const derecha = 100 + corr; // 102.3876
    const izquierda = 0 + corr; // 2.3876
    const total = derecha + izquierda; // 104.7752

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        `Desarrollo total: ${total.toFixed(2)} mm`,
      ),
    );
    expect(screen.getByText(/^102\.39 mm$/)).toBeTruthy();
    expect(screen.getByText(/^2\.39 mm$/)).toBeTruthy();
    expect(screen.getByText(/^104\.78 mm$/)).toBeTruthy();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("Acero con espesor no aprobado (1.05) NO calcula y muestra el toast de error", async () => {
    renderPage();
    setInput(0, "100"); // medida derecha
    setInput(1, "50"); // medida izquierda
    setInput(2, "1.05"); // espesor
    setInput(3, "0"); // solape
    fireEvent.click(screen.getByRole("button", { name: /calcular remate/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "No hay valores K/R aprobados para Acero con espesor 1.05 mm",
      ),
    );
    expect(toast.success).not.toHaveBeenCalled();
    // Sin resultados: sigue visible el texto de estado vacío
    expect(screen.getByText(/Introduce los valores y pulsa/i)).toBeTruthy();
  });
});
