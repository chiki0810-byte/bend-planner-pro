import { describe, expect, it } from "vitest";
import { computeBend } from "@/lib/bendCalc";
import { validateOnMachine } from "@/lib/machineValidation";

describe("validateOnMachine", () => {
  it("bloquea una geometría con pliegues fuera del largo de pieza", () => {
    const bend = computeBend({ angle: 90, distance: 60 }, 1, {
      bendAllowance90: 1.6,
      kFactor: 0.38,
      innerRadius: 1.5,
    }, 1);
    const validation = validateOnMachine({
      machineId: "jordi6",
      result: {
        bends: [bend],
        totalDevelopedLength: 100,
        pieceLength: 50,
        totalDistance: 60,
      },
      bends: [{ angle: 90, distance: 60, innerRadius: 1.5, kFactor: 0.38, direction: 1, tolerance: 0.1 }],
      material: "Acero",
      thickness: 1,
    });

    expect(validation.status).toBe("blocked");
    expect(validation.issues).toContainEqual(expect.objectContaining({
      code: "BEND_POSITION",
      level: "error",
    }));
  });
});
