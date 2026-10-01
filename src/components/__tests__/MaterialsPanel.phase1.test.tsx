import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const rows = [{ id: 1, material: "Acero", thickness: 1.0, bendAllowance90: 2.95, kFactor: 0.38, innerRadius: 1.5, isCustom: false }];
const upsertMaterial = vi.fn(async () => {});
const insertMaterialIfMissing = vi.fn(async () => {});

vi.mock("@/lib/storage", () => ({
  listMaterials: vi.fn(async () => rows),
  upsertMaterial: (...a: unknown[]) => upsertMaterial(...(a as [])),
  insertMaterialIfMissing: (...a: unknown[]) => insertMaterialIfMissing(...(a as [])),
  deleteMaterial: vi.fn(async () => {}),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import MaterialsPanel from "@/components/MaterialsPanel";

beforeEach(() => { upsertMaterial.mockClear(); insertMaterialIfMissing.mockClear(); });

describe("MaterialsPanel Fase 1", () => {
  it.each([
    ["BA90", "2.95", "bendAllowance90"],
    ["K", "0.38", "kFactor"],
    ["R", "1.5", "innerRadius"],
  ])("editar %s marca isCustom=true", async (_l, current, field) => {
    render(<MaterialsPanel />);
    const input = await screen.findByDisplayValue(current);
    fireEvent.change(input, { target: { value: "3.33" } });
    fireEvent.blur(input);
    await waitFor(() => expect(upsertMaterial).toHaveBeenCalled());
    expect(upsertMaterial).toHaveBeenCalledWith(expect.objectContaining({ [field]: 3.33, isCustom: true }));
  });

  it("nuevas filas desde defaults con isCustom=false", async () => {
    render(<MaterialsPanel />);
    fireEvent.click(await screen.findByRole("button", { name: "+ Material" }));
    fireEvent.change(await screen.findByPlaceholderText("Ej: Latón"), { target: { value: "Inox" } });
    fireEvent.click(screen.getByRole("button", { name: "Añadir" }));
    await waitFor(() => expect(insertMaterialIfMissing).toHaveBeenCalledTimes(6));
    for (const [arg] of insertMaterialIfMissing.mock.calls as unknown as [Record<string, unknown>][]) {
      expect(arg).toMatchObject({ material: "Inox", kFactor: 0.4, isCustom: false });
    }
    expect(upsertMaterial).not.toHaveBeenCalled();
  });
});
