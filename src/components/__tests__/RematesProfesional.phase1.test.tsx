import { describe, it, expect, vi, afterEach, cleanup } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/rematesProExport", () => ({ exportRemateProPdf: vi.fn(async () => {}) }));

import { toast } from "sonner";
import { getMaterialDefaultsByThickness } from "@/lib/bendCalc";
import RematesProfesional from "@/components/RematesProfesional";

afterEach(() => cleanup());

// Selector de material (primer combobox) y espesor (input junto a Solape)
const setMaterial = async (m: string) => {
  fireEvent.click(screen.getAllByRole("combobox")[0]);
  fireEvent.click(await screen.findByRole("option", { name: m }));
};

const setEspesor = (v: string) => {
  const inputs = screen.getAllByPlaceholderText("0");
  fireEvent.change(inputs[0], { target: { value: v } });
};

const setPliegue = (longitud: string, angulo: string, radio: string) => {
  const [l, a, r] = screen.getAllByPlaceholderText("mm");
  fireEvent.change(l, { target: { value: longitud } });
  fireEvent.change(screen.getByPlaceholderText("°"), { target: { value: angulo } });
  fireEvent.change(r, { target: { value: radio } });
};

describe("RematesProfesional — K vía motor central Fase 1", () => {
  it("regla central: Acero 1.2 => K=0.40 y Acero 1.5 => K=0.42 (motor bendCalc)", () => {
    expect(getMaterialDefaultsByThickness("Acero", 1.2)!.kFactor).toBe(0.4);
    expect(getMaterialDefaultsByThickness("Acero", 1.5)!.kFactor).toBe(0.42);
et  });

  it("espesor no aprobado => undefined", () => {
    expect(getMaterialDefaultsByThickness("Acero", 1.05)).toBeUndefined();
  });

  it("Acero 1.2 calcula con K=0.40 (BA90 = 2.953097 a 90°, R=1.5)", async () => {
    render(<RematesProfesional />);
    await setMaterial("Acero");
    setEspesor("1.2");
    setPliegue("100", "90", "1.8");
    fireEvent.click(screen.getByRole("button", { name: /calcular remate \(pro\)/i }));

    // BA esperado = (π/180)*90*(1.8 + 0.40*1.2) = 2.9531 → punta = 100 + 2.95
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("206.05")),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("Acero con espesor no aprobado (1.05) NO calcula y muestra error", async () => {
    render(<RematesProfesional />);
    await setMaterial("Acero");
    setEspesor("1.05");
    setPliegue("100", "90", "1.8");
    fireEvent.click(screen.getByRole("button", { name: /calcular remate \(pro\)/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.queryByText(/Exportar PDF profesional/i)).not.toBeInTheDocument();
  });
});
