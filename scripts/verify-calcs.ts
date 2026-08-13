import { computeBend, DEFAULT_THICKNESS_TABLE } from "../src/lib/bendCalc.ts";

// Verificar que los cálculos existentes no cambian
const testCases = [
  { thickness: 0.5, angle: 90, distance: 50, innerRadius: undefined, kFactor: undefined, expected: { ba: 1.24, bd: 0.40 } },
  { thickness: 1.0, angle: 90, distance: 100, innerRadius: undefined, kFactor: undefined, expected: { ba: 2.46, bd: 0.78 } },
  { thickness: 1.5, angle: 90, distance: 75, innerRadius: undefined, kFactor: undefined, expected: { ba: 3.71, bd: 1.17 } },
];

let allOk = true;

for (const tc of testCases) {
  const defaults = DEFAULT_THICKNESS_TABLE[tc.thickness];
  const result = computeBend({
    angle: tc.angle,
    distance: tc.distance,
    innerRadius: tc.innerRadius,
    kFactor: tc.kFactor,
  }, tc.thickness, defaults, 1);

  const baMatch = Math.abs(result.bendAllowance - tc.expected.ba) < 0.01;
  const bdMatch = Math.abs(result.bendDeduction - tc.expected.bd) < 0.01;

  if (!baMatch || !bdMatch) {
    console.error(`FAIL thickness=${tc.thickness}: BA=${result.bendAllowance} (expected ${tc.expected.ba}), BD=${result.bendDeduction} (expected ${tc.expected.bd})`);
    allOk = false;
  } else {
    console.log(`OK thickness=${tc.thickness}: BA=${result.bendAllowance}, BD=${result.bendDeduction}`);
  }
}

if (allOk) {
  console.log("\n✅ Todos los cálculos existentes permanecen sin cambios.");
} else {
  console.log("\n❌ Algunos cálculos cambiaron.");
  process.exit(1);
}
