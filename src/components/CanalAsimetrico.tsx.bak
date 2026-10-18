import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calculator, Layers } from "lucide-react";
import { calcularCanal, MATERIALES_K, solapeMinimo, type CanalResult } from "@/lib/plegadoPro";
import { Warnings } from "./PlegadoConico";

interface PRow { id: string; longitud_mm: string; angulo_deg: string; radio_mm: string; }
const newRow = (): PRow => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, longitud_mm: "", angulo_deg: "90", radio_mm: "1" });

const CanalAsimetrico = () => {
  const [puntaA, setPuntaA] = useState("30");
  const [puntaB, setPuntaB] = useState("50");
  const [solape, setSolape] = useState("");
  const [espesor, setEspesor] = useState("1");
  const [material, setMaterial] = useState("Acero");
  const [pliegues, setPliegues] = useState<PRow[]>([newRow()]);
  const [res, setRes] = useState<CanalResult | null>(null);

  const update = (id: string, k: keyof Omit<PRow,"id">, v: string) =>
    setPliegues((p) => p.map((r) => r.id === id ? { ...r, [k]: v } : r));
  const add = () => setPliegues((p) => [...p, newRow()]);
  const remove = (id: string) => setPliegues((p) => p.length > 1 ? p.filter((r) => r.id !== id) : p);

  const calcular = () => {
    let s = Number(solape);
    if (!s) { s = solapeMinimo(Number(espesor)); setSolape(String(s)); }
    setRes(calcularCanal({
      punta_a_mm: Number(puntaA),
      punta_b_mm: Number(puntaB),
      solape_mm: s,
      espesor_mm: Number(espesor),
      material,
      pliegues: pliegues.map((p) => ({
        longitud_mm: Number(p.longitud_mm) || 0,
        angulo_deg: Number(p.angulo_deg) || 0,
        radio_mm: Number(p.radio_mm) || 0,
      })),
    }));
  };

  const totalPreview = (Number(puntaA) || 0) + (Number(puntaB) || 0) + (Number(solape) || 0);
  const pa = totalPreview > 0 ? (Number(puntaA) / totalPreview) * 100 : 33;
  const pb = totalPreview > 0 ? (Number(puntaB) / totalPreview) * 100 : 33;
  const ps = totalPreview > 0 ? (Number(solape) / totalPreview) * 100 : 33;

  return (
    <Card className="border-emerald-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="w-5 h-5 text-emerald-300" /> Canal asimétrico con solape
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Punta A (mm)" value={puntaA} onChange={setPuntaA} />
          <Field label="Punta B (mm)" value={puntaB} onChange={setPuntaB} />
          <Field label="Solape (mm)" value={solape} onChange={setSolape} placeholder="auto" />
          <Field label="Espesor (mm)" value={espesor} onChange={setEspesor} step="0.1" />
          <div className="space-y-2 md:col-span-2">
            <Label>Material</Label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MATERIALES_K).map(([m, k]) => (
                  <SelectItem key={m} value={m}>{m} (K={k})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Pliegues</Label>
            <Button size="sm" variant="ghost" onClick={add}><Plus className="w-4 h-4 mr-1" /> Pliegue</Button>
          </div>
          {pliegues.map((p, i) => (
            <div key={p.id} className="grid grid-cols-[24px_1fr_1fr_1fr_36px] gap-2 items-end p-2 rounded-md border border-border bg-muted/20">
              <span className="text-xs text-muted-foreground pb-2">#{i+1}</span>
              <SmallField label="Long." value={p.longitud_mm} onChange={(v) => update(p.id, "longitud_mm", v)} />
              <SmallField label="Áng." value={p.angulo_deg} onChange={(v) => update(p.id, "angulo_deg", v)} />
              <SmallField label="Radio" value={p.radio_mm} onChange={(v) => update(p.id, "radio_mm", v)} />
              <Button size="icon" variant="ghost" onClick={() => remove(p.id)} disabled={pliegues.length <= 1}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button onClick={calcular} className="w-full" size="lg">
          <Calculator className="w-4 h-4 mr-2" /> Calcular desarrollo
        </Button>

        {res && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <ResBox label="BA total" value={res.ba_total_mm} unit="mm" />
              <ResBox label="Pliegues" value={res.desarrollo_pliegues_mm} unit="mm" />
              <ResBox label="Desarrollo total" value={res.desarrollo_total_mm} unit="mm" highlight />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Vista previa</Label>
              <div className="w-full h-8 rounded-md overflow-hidden flex border border-border">
                <div className="h-full bg-sky-500/80 text-[10px] text-white flex items-center justify-center font-semibold" style={{ width: `${pa}%` }}>{pa>10?"A":""}</div>
                <div className="h-full bg-amber-500/80 text-[10px] text-white flex items-center justify-center font-semibold" style={{ width: `${ps}%` }}>{ps>10?"Solape":""}</div>
                <div className="h-full bg-emerald-500/80 text-[10px] text-white flex items-center justify-center font-semibold" style={{ width: `${pb}%` }}>{pb>10?"B":""}</div>
              </div>
            </div>
            {res.advertencias.length > 0 && <Warnings list={res.advertencias} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Field = ({ label, value, onChange, step, placeholder }: { label: string; value: string; onChange: (v:string)=>void; step?: string; placeholder?: string }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input type="number" inputMode="decimal" step={step} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const SmallField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
    <Input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const ResBox = ({ label, value, unit, highlight }: { label: string; value: number; unit: string; highlight?: boolean }) => (
  <div className={`p-3 rounded-lg border ${highlight ? "border-emerald-500/40 bg-emerald-500/10" : "border-border bg-muted/30"}`}>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`text-lg font-bold tabular-nums ${highlight ? "text-emerald-300" : ""}`}>
      {value.toFixed(2)} <span className="text-xs font-normal">{unit}</span>
    </div>
  </div>
);

export default CanalAsimetrico;
