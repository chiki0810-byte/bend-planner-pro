export interface DxfLine {
  layer?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
}

/** Lee las entidades LINE de un DXF ASCII y conserva sus dos coordenadas. */
export function parseDxfLines(text: string): DxfLine[] {
  const pairs = text.split(/\r?\n/).map((line) => line.trim());
  const result: DxfLine[] = [];

  for (let i = 0; i + 1 < pairs.length;) {
    if (pairs[i] !== "0" || pairs[i + 1].toUpperCase() !== "LINE") {
      i += 1;
      continue;
    }

    i += 2;
    let layer: string | undefined;
    let x1: number | undefined;
    let y1: number | undefined;
    let x2: number | undefined;
    let y2: number | undefined;

    while (i + 1 < pairs.length && pairs[i] !== "0") {
      const code = pairs[i];
      const value = pairs[i + 1];
      const coordinate = Number.parseFloat(value);

      switch (code) {
        case "8":
          layer = value;
          break;
        case "10":
          x1 = coordinate;
          break;
        case "20":
          y1 = coordinate;
          break;
        case "11":
          x2 = coordinate;
          break;
        case "21":
          y2 = coordinate;
          break;
      }
      i += 2;
    }

    if ([x1, y1, x2, y2].every((value) => typeof value === "number" && Number.isFinite(value))) {
      const length = Math.hypot(x2! - x1!, y2! - y1!);
      if (length > 0.01) {
        result.push({ layer, x1: x1!, y1: y1!, x2: x2!, y2: y2!, length });
      }
    }
  }

  return result;
}
