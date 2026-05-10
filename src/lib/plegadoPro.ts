// Cálculos del módulo profesional de plegado (offline)

export const MATERIALES_K: Record<string, number> = {
  Acero: 0.33,
  Inox: 0.40,
  Aluminio: 0.50,
  Galvanizado: 0.33,
  Corten: 0.33,
  "Duro 500": 0.33,
  "Duro 600": 0.33,
  Latón: 0.45,
  Cobre: 0.45,
};

export const getK = (mat: string): number => MATERIALES_K[mat] ?? 0.33;

// ===== CÓNICO / ENCHUFABLE =====
export interface ConicoInput {
  diametro_mm: number;     // D (boca menor o referencia)
  altura_mm: number;       // h
  boca_mayor_mm?: number;  // R1 (opcional para tronco-cónico)
  boca_menor_mm?: number;  // R2
  espesor_mm: number;      // t
  material: string;
  plegado_en_prensa?: boolean;
  angulo_pliegue_deg?: number; // si va a prensa
}

export interface ConicoResult {
  radio_base: number;
  radio_efectivo: number;
  angulo_sector_deg: number;
  desarrollo_mm: number;
  generatriz_mm: number;
  ba_correccion_mm: number;
  advertencias: string[];
  requiere_rodillo: boolean;
}

export const calcularConico = (i: ConicoInput): ConicoResult => {
  const K = getK(i.material);
  const t = i.espesor_mm || 0;
  const D = i.diametro_mm || 0;
  const h = i.altura_mm || 0;

  const R = D / 2;
  const R_ef = R + K * t;

  // Tronco-cónico: usar bocas si están definidas
  const Rmayor = (i.boca_mayor_mm ?? D) / 2;
  const Rmenor = (i.boca_mayor_mm && i.boca_menor_mm ? i.boca_menor_mm : D) / 2;

  // Generatriz (slant height) del tronco
  const dr = Math.abs(Rmayor - Rmenor);
  const generatriz = Math.sqrt(h * h + dr * dr);

  // Ángulo del sector desplegado: theta = (R / L) * 360  (cono completo)
  // Para tronco-cónico se usa el radio mayor sobre la generatriz proyectada al ápice
  let L_apice = generatriz;
  if (Rmayor !== Rmenor && dr > 0) {
    L_apice = (generatriz * Rmayor) / dr;
  }
  const angulo_sector = L_apice > 0 ? (Rmayor / L_apice) * 360 : 0;

  // Desarrollo del arco exterior
  const desarrollo = (2 * Math.PI * (L_apice + K * t) * angulo_sector) / 360;

  // Corrección BA si se pliega en prensa
  let ba = 0;
  if (i.plegado_en_prensa && i.angulo_pliegue_deg) {
    ba = (Math.PI / 180) * i.angulo_pliegue_deg * R_ef;
  }

  const advertencias: string[] = [];
  if (angulo_sector < 30) advertencias.push("Ángulo del sector muy cerrado (<30°): verificar geometría.");
  if (angulo_sector > 350) advertencias.push("Ángulo del sector casi completo: revisar bocas y altura.");
  if (t > 2.5) advertencias.push("Espesor elevado (>2.5 mm): puede requerir rodillo o prensa con utillaje especial.");
  if (h > 800) advertencias.push("Altura elevada (>800 mm): riesgo de colisión con la máquina.");
  const requiere_rodillo = !i.plegado_en_prensa && (Rmayor < 200 || t > 1.5);
  if (requiere_rodillo) advertencias.push("Geometría recomendada para rodillo (curvadora), no para prensa.");

  return {
    radio_base: R,
    radio_efectivo: R_ef,
    angulo_sector_deg: angulo_sector,
    desarrollo_mm: desarrollo + ba,
    generatriz_mm: generatriz,
    ba_correccion_mm: ba,
    advertencias,
    requiere_rodillo,
  };
};

// ===== CANAL ASIMÉTRICO CON SOLAPE =====
export interface PliegueCanal {
  longitud_mm: number;
  angulo_deg: number;
  radio_mm: number;
}

export interface CanalInput {
  punta_a_mm: number;
  punta_b_mm: number;
  solape_mm: number;
  pliegues: PliegueCanal[];
  espesor_mm: number;
  material: string;
}

export interface CanalResult {
  desarrollo_pliegues_mm: number;
  desarrollo_total_mm: number;
  ba_total_mm: number;
  advertencias: string[];
}

export const solapeMinimo = (t: number): number => {
  if (t <= 0.6) return 10;
  if (t <= 0.9) return 12;
  if (t <= 1.05) return 15;
  if (t <= 1.5) return 20;
  return 25;
};

export const calcularCanal = (i: CanalInput): CanalResult => {
  const K = getK(i.material);
  const t = i.espesor_mm || 0;

  let desarrollo = 0;
  let ba_total = 0;
  for (const p of i.pliegues) {
    const ba = (Math.PI / 180) * (p.angulo_deg || 0) * ((p.radio_mm || 0) + K * t);
    ba_total += ba;
    desarrollo += (p.longitud_mm || 0) + ba;
  }

  const total = i.punta_a_mm + i.punta_b_mm + desarrollo - i.solape_mm;

  const advertencias: string[] = [];
  if (i.punta_a_mm > 0 && i.punta_a_mm < 20) advertencias.push("Punta A muy corta (<20 mm): difícil de manipular.");
  if (i.punta_b_mm > 0 && i.punta_b_mm < 20) advertencias.push("Punta B muy corta (<20 mm): difícil de manipular.");
  const min_solape = solapeMinimo(t);
  if (i.solape_mm < min_solape) advertencias.push(`Solape insuficiente: mínimo recomendado ${min_solape} mm para t=${t} mm.`);
  if (i.pliegues.some((p) => p.longitud_mm > 300)) advertencias.push("Pliegue profundo (>300 mm): verificar altura útil de la máquina.");
  if (t > 2 && i.material.includes("Galvanizado")) advertencias.push("Galvanizado >2 mm: fuera de rango habitual.");

  return {
    desarrollo_pliegues_mm: desarrollo,
    desarrollo_total_mm: total,
    ba_total_mm: ba_total,
    advertencias,
  };
};

// ===== VALIDACIÓN DE MÁQUINA =====
export type Maquina = "Stefa 8m" | "Jordi PH6100-180" | "Prensa 6m" | "Rodillo";

export interface ValidacionInput {
  maquina: Maquina;
  longitud_pieza_mm: number;
  altura_pieza_mm?: number;
  espesor_mm: number;
  material: string;
  requiere_rodillo?: boolean;
}

export const validarMaquina = (i: ValidacionInput): string[] => {
  const w: string[] = [];
  const limites: Record<Maquina, { L: number; H?: number; tMax: number }> = {
    "Stefa 8m": { L: 8000, H: 200, tMax: 1.5 },
    "Jordi PH6100-180": { L: 6100, tMax: 2.0 },
    "Prensa 6m": { L: 6000, tMax: 6.0 },
    Rodillo: { L: 3000, tMax: 3.0 },
  };
  const lim = limites[i.maquina];
  if (i.longitud_pieza_mm > lim.L) w.push(`Longitud (${i.longitud_pieza_mm} mm) supera el máximo de ${i.maquina} (${lim.L} mm).`);
  if (lim.H && i.altura_pieza_mm && i.altura_pieza_mm > lim.H) w.push(`Altura (${i.altura_pieza_mm} mm) supera el máximo (${lim.H} mm).`);
  if (i.espesor_mm > lim.tMax) w.push(`Espesor (${i.espesor_mm} mm) fuera de rango para ${i.maquina} (máx ${lim.tMax} mm).`);
  if (i.material.includes("Galvanizado") && i.espesor_mm > 2.0) w.push("Galvanizado >2 mm no recomendado.");
  if (i.requiere_rodillo && i.maquina !== "Rodillo") w.push("La pieza requiere rodillo (curvadora), no plegadora.");
  return w;
};
