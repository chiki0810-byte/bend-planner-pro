import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("@/lib/storage", () => ({ savePiece: vi.fn() }));

import FichaPiezaRapidaPage from "@/pages/FichaPiezaRapidaPage";
import { savePiece } from "@/lib/storage";

afterEach(cleanup);
const originalScrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => { Element.prototype.scrollIntoView = vi.fn(); });
afterAll(() => { Element.prototype.scrollIntoView = originalScrollIntoView; });

describe("FichaPiezaRapidaPage", () => {
  it("muestra K aprobado para material y espesor, o indica que falta", async () => {
    const { container } = render(<FichaPiezaRapidaPage />);
    const materialSelect = screen.getAllByRole("combobox")[0];

    fireEvent.click(materialSelect);
    const aceroAprobado = await screen.findByRole("option", { name: "Acero (K=0.38)" });
    expect(aceroAprobado).toBeTruthy();
    fireEvent.click(aceroAprobado);

    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "2" } });
    fireEvent.click(materialSelect);
    expect(await screen.findByRole("option", { name: "Acero (sin K aprobada para 2.0 mm)" })).toBeTruthy();
    expect(container.querySelector(".text-4xl")?.textContent).toContain("0.00");
  });

  it("invalida desarrollo y resultados derivados al cambiar el espesor", async () => {
    const { container } = render(<FichaPiezaRapidaPage />);
    fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Calcular desarrollo" }));

    const output = container.querySelector(".text-4xl");
    expect(output?.textContent).not.toContain("0.00");

    fireEvent.click(screen.getByRole("button", { name: "Validar máquina" }));
    fireEvent.click(screen.getByRole("button", { name: "Generar secuencia" }));
    expect(screen.queryByText("Sin secuencia generada.")).toBeNull();

    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "2" } });
    await waitFor(() => expect(output?.textContent).toContain("0.00"));
    expect(screen.getByText("Sin secuencia generada.")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Ej: Bandeja lateral"), { target: { value: "Prueba" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(savePiece).not.toHaveBeenCalled();
  });
});
