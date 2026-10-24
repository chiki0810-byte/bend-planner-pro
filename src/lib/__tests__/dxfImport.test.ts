import { describe, expect, it } from "vitest";
import { parseDxfLines } from "@/lib/dxfImport";

describe("parseDxfLines", () => {
  it("conserva líneas horizontales con coordenadas cero", () => {
    const dxf = "0\nSECTION\n2\nENTITIES\n0\nLINE\n8\nPLIEGUES\n10\n0\n20\n0\n11\n100\n21\n0\n0\nENDSEC\n0\nEOF";

    expect(parseDxfLines(dxf)).toEqual([
      { layer: "PLIEGUES", x1: 0, y1: 0, x2: 100, y2: 0, length: 100 },
    ]);
  });

  it("calcula longitudes verticales y diagonales con ambas coordenadas", () => {
    const dxf = [
      "0", "LINE", "10", "2", "20", "3", "11", "2", "21", "8",
      "0", "LINE", "10", "0", "20", "0", "11", "3", "21", "4",
      "0", "ENDSEC",
    ].join("\n");

    expect(parseDxfLines(dxf).map(({ length }) => length)).toEqual([5, 5]);
  });

  it("omite entidades degeneradas e incompletas", () => {
    const dxf = [
      "0", "LINE", "10", "1", "20", "1", "11", "1", "21", "1",
      "0", "LINE", "10", "0", "20", "0", "11", "5",
      "0", "ENDSEC",
    ].join("\n");

    expect(parseDxfLines(dxf)).toEqual([]);
  });
});
