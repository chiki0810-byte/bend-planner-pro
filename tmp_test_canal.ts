import { calcularCanal } from "./src/lib/plegadoPro";

const fmt = (n: number) => n.toFixed(4);

const cases = [
  { name: "Caso 1", input: { punta_a_mm:0, punta_b_mm:0, solape_mm:0, espesor_mm:1.0, material:"Acero", pliegues:[{ longitud_mm:100, angulo_deg:90, radio_mm:1.5 }] }, expBA:2.8746, expDev:102.8746 },
  { name: "Caso 2", input: { punta_a_mm:0, punta_b_mm:0, solape_mm:0, espesor_mm:1.0, material:"Inox", pliegues:[{ longitud_mm:50, angulo_deg:90, radio_mm:1.5 }] }, expBA:2.9845, expDev:52.9845 },
  { name: "Caso 3", input: { punta_a_mm:0, punta_b_mm:0, solape_mm:0, espesor_mm:1.5, material:"Aluminio", pliegues:[{ longitud_mm:80, angulo_deg:45, radio_mm:2.0 }, { longitud_mm:60, angulo_deg:135, radio_mm:2.0 }] }, expBA:8.6394, expDev:148.6394 },
  { name: "Caso 4", input: { punta_a_mm:0, punta_b_mm:0, solape_mm:0, espesor_mm:1.0, material:"Corten", pliegues:[{ longitud_mm:120, angulo_deg:0, radio_mm:1.5 }] }, expBA:0, expDev:120.0000 },
  { name: "Caso 5", input: { punta_a_mm:30, punta_b_mm:50, solape_mm:15, espesor_mm:1.0, material:"Acero", pliegues:[{ longitud_mm:100, angulo_deg:90, radio_mm:1.5 }] }, expBA:2.8746, expDev:167.8746 },
];

let ok = true;
for (const c of cases) {
  const r = calcularCanal(c.input as any);
  const baOk = Math.abs(r.ba_total_mm - c.expBA) < 0.0001;
  const devOk = Math.abs(r.desarrollo_total_mm - c.expDev) < 0.0001;
  console.log(`${c.name}: BA=${fmt(r.ba_total_mm)} (${baOk ? "OK" : "FAIL"}), D=${fmt(r.desarrollo_total_mm)} (${devOk ? "OK" : "FAIL"})`);
  if (!baOk || !devOk) ok = false;
}
process.exit(ok ? 0 : 1);
