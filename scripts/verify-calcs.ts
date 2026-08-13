import { computeBend, DEFAULT_THICKNESS_TABLE } from "../src/lib/bendCalc.ts";

// Verificar que los cálculos existentes no cambian comparando con la fórmula directa
const testCases = [
  { thickness: 0.5, angle: 90, distance: 50 },
  { thickness: 0.6, angle: 90, distance: 60 },
  { thickness: 0.8, angle: 90, distance: 70 },
  { thickness: 1.0, angle: 90, distance: 100 },
  { thickness: 1.2, angle: 90, distance: 80 },
  { thickness: 1.5, angle: 90, distance: 75 },
];

let allOk = true;

for (const tc of testCases) {
  const defaults = DEFAULT_THICKNESS_TABLE[tc.thickness];
  const result = computeBend({
    angle: tc.angle,
    distance: tc.distance,
  }, tc.thickness, defaults, 1);

  const expectedBA = Math.round(((Math.PI / 180) * tc.angle * (defaults.innerRadius + defaults.kFactor * tc.thickness)) * 100) / 100;
  const expectedOSSB = Math.round((Math.tan((Math.PI / 180) * (tc.angle / 2)) * (defaults.innerRadius + tc.thickness)) * 100) / 100;
  const expectedBD = Math.round((2 * expectedOSSB - expectedBA) * 100) / 100;

  const baMatch = Math.abs(result.bendAllowance - expectedBA) < 1e-6;
  const bdMatch = Math.abs(result.bendDeduction - expectedBD) < 1e-6;
  const ossbMatch = Math.abs(result.outsideSetback - expectedOSSB) < 1e-6;

  if (!baMatch || !bdMatch || !ossbMatch) {
    console.error(`FAIL thickness=${tc.thickness}: BA=${result.bendAllowance} (expected ${expectedBA}), BD=${result.bendDeduction} (expected ${expectedBD}), OSSB=${result.outsideSetback} (expected ${expectedOSSB})`);
    allOk = false;
  } else {
    console.log(`OK thickness=${tc.thickness}: BA=${result.bendAllowance.toFixed(3)}, BD=${result.bendDeduction.toFixed(3)}, OSSB=${result.outsideSetback.toFixed(3)}`);
  }
}

if (allOk) {
  console.log("\n✅ Todos los cálculos existentes permanecen sin cambios y coinciden con la fórmula.");
} else {
  console.log("\n❌ Algunos cálculos cambiaron.");
  process.exit(1);
}

