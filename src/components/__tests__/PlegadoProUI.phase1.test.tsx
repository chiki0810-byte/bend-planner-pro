import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const toastError = vi.fn();
vi.mock("sonner", () => ({ toast: { error: (...a: unknown[]) => toastError(...a), success: vi.fn() } }));

import PlegadoConico from "@/components/PlegadoConico";
import CanalAsimetrico from "@/components/CanalAsimetrico";

beforeEach(() => toastError.mockClear());
afterEach(cleanup);

const espesorInput = (label: string) =>
  screen.getByText(label).parentElement!.querySelector("input") as HTMLInputElement;

describe("UI Cónico", () => {
  it("aprobado muestra resultado; luego 0.7 muestra error y borra el resultado", () => {
    render(<PlegadoConico />);
    fireEvent.change(espesorInput("Espesor t (mm)"), { target: { value: "0.8" } });
    fireEvent.click(screen.getByRole("button", { name: /Calcular/ }));
    expect(screen.queryByText("Desarrollo")).not.toBeNull();
    expect(toastError).not.toHaveBeenCalled();

    fireEvent.change(espesorInput("Espesor t (mm)"), { target: { value: "0.7" } });
    fireEvent.click(screen.getByRole("button", { name: /Calcular/ }));
    expect(toastError).toHaveBeenCalledWith("No hay valores K/R aprobados para Acero con espesor 0.7 mm");
    expect(screen.queryByText("Desarrollo")).toBeNull();
  });
});

describe("UI Canal", () => {
  it("aprobado muestra resultado; luego 0.7 muestra error y borra el resultado", () => {
    render(<CanalAsimetrico />);
    fireEvent.change(espesorInput("Espesor (mm)"), { target: { value: "0.8" } });
    fireEvent.click(screen.getByRole("button", { name: /Calcular desarrollo/ }));
    expect(screen.queryByText("Desarrollo total")).not.toBeNull();

    fireEvent.change(espesorInput("Espesor (mm)"), { target: { value: "0.7" } });
    fireEvent.click(screen.getByRole("button", { name: /Calcular desarrollo/ }));
    expect(toastError).toHaveBeenCalledWith("No hay valores K/R aprobados para Acero con espesor 0.7 mm");
    expect(screen.queryByText("Desarrollo total")).toBeNull();
  });
});
