import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cone, AlertTriangle, Calculator } from "lucide-react";
import { calcularConico, MATERIALES_K, type ConicoResult } from "@/lib/plegadoPro";

const PlegadoConico = () => {
  const [diametro, setDiametro] = useState("400");
  const [altura, setAltura] = useState("200");
  const [bocaMayor, setBocaMayor] = useState("400");
  const [bocaMenor, setBocaMenor] = useState("300");
  const [espesor, setEspesor] = useState("1");
  const [material, setMaterial] = useState("Acero");
  const [enPrensa, setEnPrensa] = useState(false);
  const [anguloPliegue, setAnguloPliegue] = useState("90");
  const [res, setRes] = useState<ConicoResult | null>(null);

  const calcular = () => {
    setRes(
      calcularConico({
        diametro_mm: Number(diametro),
        altura_mm: Number(altura),
        boca_mayor_mm: Number(bocaMayor) || undefined,
        boca_menor_mm: Number(bocaMenor) || undefined,
        espesor_mm: Number(espesor),
        material,
        plegado_en_prensa: enPrensa,
        angulo_pliegue_deg: Number(anguloPliegue) || undefined,
      }),
    );
  };

  return (
    <Card className="border-sky-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cone className="w-5 h-5 text-sky-300" /> Plegado cónico / enchufable
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Diámetro D (mm)" value={diametro} onChange={setDiametro} />
          <Field label="Altura (mm)" value={altura} onChange={setAltura} />
          <Field label="Espesor t (mm)" value={espesor} onChange={setEspesor} step="0.1" />
          <Field label="Boca mayor (mm)" value={bocaMayor} onChange={setBocaMayor} />
          <Field label="Boca menor (mm)" value={bocaMenor} onChange={setBocaMenor} />
          <div className="space-y-2">
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

        <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/20">
          <Switch checked={enPrensa} onCheckedChange={setEnPrensa} />
          <Label className="text-sm">Plegado en prensa (aplicar BA)</Label>
          {enPrensa && (
            <div className="ml-auto w-32">
              <Input type="number" value={anguloPliegue} onChange={(e) => setAnguloPliegue(e.target.value)} placeholder="Ángulo °" />
            </div>
          )}
        </div>

        <Button onClick={calcular} className="w-full" size="lg">
          <Calculator className="w-4 h-4 mr-2" /> Calcular
        </Button>

        {res && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ResBox label="Radio efectivo" value={res.radio_efectivo} unit="mm" />
              <ResBox label="Generatriz" value={res.generatriz_mm} unit="mm" />
              <ResBox label="Ángulo sector" value={res.angulo_sector_deg} unit="°" />
              <ResBox label="Desarrollo" value={res.desarrollo_mm} unit="mm" highlight />
            </div>
            {res.ba_correccion_mm > 0 && (
              <p className="text-xs text-muted-foreground">
                Corrección BA aplicada: {res.ba_correccion_mm.toFixed(2)} mm
              </p>
            )}
            {res.advertencias.length > 0 && <Warnings list={res.advertencias} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Field = ({ label, value, onChange, step }: { label: string; value: string; onChange: (v: string) => void; step?: string }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input type="number" inputMode="decimal" step={step} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const ResBox = ({ label, value, unit, highlight }: { label: string; value: number; unit: string; highlight?: boolean }) => (
  <div className={`p-3 rounded-lg border ${highlight ? "border-sky-500/40 bg-sky-500/10" : "border-border bg-muted/30"}`}>
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`text-lg font-bold tabular-nums ${highlight ? "text-sky-300" : ""}`}>
      {value.toFixed(2)} <span className="text-xs font-normal">{unit}</span>
    </div>
  </div>
);

export const Warnings = ({ list }: { list: string[] }) => (
  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-1">
    <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
      <AlertTriangle className="w-4 h-4" /> Advertencias
    </div>
    <ul className="text-xs text-amber-100/90 space-y-0.5 list-disc pl-5">
      {list.map((w, i) => <li key={i}>{w}</li>)}
    </ul>
  </div>
);

export default PlegadoConico;
