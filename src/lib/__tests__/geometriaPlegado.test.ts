import { describe, expect, it } from "vitest";
import {
  calculateProfileDevelopment,
  type BendGeometry,
  type SegmentDimension,
} from "../geometriaPlegado";

describe("calculateProfileDevelopment", () => {
  it("invalida el resultado si una cota exterior requiere una transformación pendiente", () => {
    const segments: SegmentDimension[] = [
      { id: "s1", dimension: 100, dimensionReference: "inside" },
      { id: "s2", dimension: 50, dimensionReference: "outside" },
    ];

    const bends: BendGeometry[] = [
      {
        id: "b1",
        angleDeg: 90,
        radius: 1,
        thickness: 1,
        kFactor: 0.38,
      },
    ];

    const result = calculateProfileDevelopment(segments, bends);

    expect(result.valid).toBe(false);
    expect(result.totalFlatLength).toBeNull();
    expect(result.segments[1].status).toBe("requires_transform");
  });
});