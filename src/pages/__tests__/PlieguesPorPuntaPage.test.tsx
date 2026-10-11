// Pruebas de CARACTERIZACIÓN: fijan el comportamiento ACTUAL de la página,
// incluida la contradicción conocida (pliegue individual = L + BA, total punta = ΣL − ΣBA).
// No validan que el comportamiento sea físicamente correcto.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import PlieguesPorPuntaPage from "@/pages/PlieguesPorPuntaPage";

let navState: any = null;
const Capture = () => {
  navState = useLocation().state;
  return <div>RESULTADO_CAPTURADO</div>;
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<PlieguesPorPuntaPage />} />
        <Route path="/resultado-pieza" element={<Capture />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  navState = null;
});
afterEach(() => cleanup());

// Texto del valor mostrado bajo una etiqueta (ResultBox / CalcBox): "47.64 mm" -> "47.64"
const valueOf = (labelEl: HTMLElement) =>
  (labelEl.nextElementSibling?.textContent ?? "").replace("mm", "").replace("°", "").trim();
const total = (label: string) => valueOf(screen.getByText(label));
const totalD = () => valueOf(screen.getByText(/^D:/));
const pliegueDesarrollos = () => screen.getAllByText("Desarrollo").map(valueOf);

// spinbuttons en orden DOM: [Espesor, K, R, ...(Longitud, Ángulo) por pliegue A, luego B]
const spin = () => screen.getAllByRole("spinbutton") as HTMLInputElement[];
const setPliegue = (idx: number, longitud: string, angulo?: string) => {
  fireEvent.change(spin()[3 + idx * 2], { target: { value: longitud } });
  if (angulo !== undefined) fireEvent.change(spin()[4 + idx * 2], { target: { value: angulo } });
};
const addA = () => fireEvent.click(screen.getByRole("button", { name: /Añadir pliegue A/ }));

describe("PlieguesPorPuntaPage — caracterización del comportamiento actual", () => {
  it("valores iniciales: espesor 1, K 0.5, R 1", () => {
    renderPage();
    expect(spin().slice(0, 3).map((i) => i.value)).toEqual(["1", "0.5", "1"]);
  });

  it("(1) cero pliegues: A, B y total = 0.00", () => {
    renderPage();
    expect(total("Desarrollo Punta A")).toBe("0.00");
    expect(total("Desarrollo Punta B")).toBe("0.00");
    expect(totalD()).toBe("0.00");
    expect(screen.getByText("D:0")).toBeTruthy();
  });

  it("(2) un pliegue A L=50, 90°: individual = L+BA (52.36), total punta = L−BA (47.64)", () => {
    renderPage();
    addA();
    setPliegue(0, "50", "90");
    expect(valueOf(screen.getByText("Ganancia (BA)"))).toBe("2.36");
    expect(valueOf(screen.getByText("Compensación"))).toBe("52.36");
    expect(pliegueDesarrollos()).toEqual(["52.36"]);
    expect(total("Desarrollo Punta A")).toBe("47.64");
    expect(total("Desarrollo Punta B")).toBe("0.00");
    expect(totalD()).toBe("47.64");
  });

  it("(3) pliegue nuevo sin editar (L=0, 90°): total punta negativo −2.36", () => {
    renderPage();
    addA();
    expect(spin()[3].value).toBe("0");
    expect(spin()[4].value).toBe("90");
    expect(pliegueDesarrollos()).toEqual(["2.36"]);
    expect(total("Desarrollo Punta A")).toBe("-2.36");
    expect(totalD()).toBe("-2.36");
  });

  it("(4) ángulo 0°: BA=0, individual y total coinciden (50.00)", () => {
    renderPage();
    addA();
    setPliegue(0, "50", "0");
    expect(valueOf(screen.getByText("Ganancia (BA)"))).toBe("0.00");
    expect(valueOf(screen.getByText("Áng. máquina"))).toBe("180.00");
    expect(pliegueDesarrollos()).toEqual(["50.00"]);
    expect(total("Desarrollo Punta A")).toBe("50.00");
  });

  it("(5) dos pliegues en A (50/90, 30/90), ninguno en B: A = 80 − 2·2.356 = 75.29; total = A", () => {
    renderPage();
    addA();
    addA();
    setPliegue(0, "50", "90");
    setPliegue(1, "30", "90");
    expect(pliegueDesarrollos()).toEqual(["52.36", "32.36"]);
    expect(total("Desarrollo Punta A")).toBe("75.29");
    expect(total("Desarrollo Punta B")).toBe("0.00");
    expect(totalD()).toBe("75.29");
    expect(screen.getByText("Sin pliegues definidos para la punta B.")).toBeTruthy();
  });

  it("(6) el estado enviado a /resultado-pieza coincide con los totales visibles", () => {
    renderPage();
    addA();
    setPliegue(0, "50", "90");
    const visA = total("Desarrollo Punta A");
    const visB = total("Desarrollo Punta B");
    const visT = totalD();
    fireEvent.click(screen.getByRole("button", { name: /Ver Resultado de Pieza/ }));
    expect(screen.getByText("RESULTADO_CAPTURADO")).toBeTruthy();
    expect(navState.desarrolloPuntaA.toFixed(2)).toBe(visA);
    expect(navState.desarrolloPuntaB.toFixed(2)).toBe(visB);
    expect(navState.desarrolloTotal.toFixed(2)).toBe(visT);
    expect(navState.pliegues).toHaveLength(1);
    expect(navState.pliegues[0].punta).toBe("A");
    expect(navState.pliegues[0].calc.desarrollo.toFixed(2)).toBe("52.36");
    expect(navState).toMatchObject({ espesor: 1, material: "Acero Dulce", radioInterior: 1 });
  });

  it("(7) defensivo: los inputs aceptan L negativa y ángulo >180 sin aviso", () => {
    renderPage();
    addA();
    setPliegue(0, "-10", "200");
    expect(spin()[3].value).toBe("-10");
    expect(spin()[4].value).toBe("200");
    // BA = 200° rad · 1.5 = 5.236
    expect(valueOf(screen.getByText("Ganancia (BA)"))).toBe("5.24");
    expect(pliegueDesarrollos()).toEqual(["-4.76"]);
    expect(valueOf(screen.getByText("Áng. máquina"))).toBe("-20.00");
    expect(total("Desarrollo Punta A")).toBe("-15.24");
  });
});
