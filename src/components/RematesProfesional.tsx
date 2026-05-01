import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Calculator, Layers, ImagePlus, X, FileDown } from "lucide-react";
import { toast } from "sonner";
import { exportRemateProPdf, PliegueExp } from "@/lib/rematesProExport";
import logoEmpresa from "@/assets/logo_empresa.png";

type TipoPro = "recto_simetrico" | "recto_asimetrico" | "conico_enchufable";

interface Pliegue {
  id: string;
  longitud_mm: string;
  angulo_deg: string;
  radio_mm: string;
}

const MATERIALS = [
  "Acero", "Inox", "Aluminio", "Galvanizado", "Corten",
  "Duro 500", "Duro 600", "Latón", "Cobre",
];

const getK = (m: string): number => {
  if (m.includes("Acero")) return 0.33;
  if (m.includes("Inox")) return 0.40;
  if (m.includes("Aluminio")) return 0.50;
  if (m.includes("Galvanizado")) return 0.33;
  if (m.includes("Corten")) return 0.33;
  if (m.includes("Duro 500")) return 0.33;
  if (m.includes("Duro 600")) return 0.33;
  if (m.includes("Latón")) return 0.45;
  if (m.includes("Cobre")) return 0.45;
  return 0.33;
};

const solapeAuto = (t: number): number => {
  if (t >= 0.5 && t <= 0.6) return 10;
  if (t > 0.6 && t <= 0.9) return 12;
  if (t > 0.9 && t <= 1.05) return 15;
  if (t > 1.05 && t <= 1.5) return 20;
  return 15;
};

const newPliegue = (): Pliegue => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  longitud_mm: "",
  angulo_deg: "",
  radio_mm: "",
});

const calcularPunta = (lista: Pliegue[], K: number, t: number): number =>
  lista.reduce((acc, p) => {
    const L = Number(p.longitud_mm) || 0;
    const A = Number(p.angulo_deg) || 0;
    const R = Number(p.radio_mm) || 0;
    const compensacion = (Math.PI / 180) * A * (R + K * t);
    return acc + L + compensacion;
  }, 0);

interface Props {
  // Para detección automática opcional desde el flujo simple
  puntaGrandeRef?: number;
  puntaPequenaRef?: number;
}

const RematesProfesional = ({ puntaGrandeRef, puntaPequenaRef }: Props) => {
  const [tipo, setTipo] = useState<TipoPro>("recto_simetrico");
  const [tipoTouched, setTipoTouched] = useState(false);
  const [material, setMaterial] = useState("Acero");
  const [espesor, setEspesor] = useState("");
  const [solape, setSolape] = useState("");

  const [pliegues_base, setBase] = useState<Pliegue[]>([newPliegue()]);
  const [pliegues_puntaA, setA] = useState<Pliegue[]>([newPliegue()]);
  const [pliegues_puntaB, setB] = useState<Pliegue[]>([newPliegue()]);

  const [res, setRes] = useState<{ a: number; b: number; total: number; solapeUsado: number } | null>(null);
  const [fotoPlano, setFotoPlano] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onPickFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFotoPlano(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toExp = (lista: Pliegue[]): PliegueExp[] =>
    lista.map((p) => ({
      longitud_mm: Number(p.longitud_mm) || 0,
      angulo_deg: Number(p.angulo_deg) || 0,
      radio_mm: Number(p.radio_mm) || 0,
    }));

  const exportarPdf = async () => {
    if (!res) { toast.error("Calcula primero"); return; }
    await exportRemateProPdf(
      {
        tipo: tipoEfectivo,
        material,
        espesor: Number(espesor) || 0,
        solape: res.solapeUsado,
        pliegues_base: tipoEfectivo === "recto_simetrico" ? toExp(pliegues_base) : undefined,
        pliegues_puntaA: tipoEfectivo !== "recto_simetrico" ? toExp(pliegues_puntaA) : undefined,
        pliegues_puntaB: tipoEfectivo !== "recto_simetrico" ? toExp(pliegues_puntaB) : undefined,
        desarrollo_puntaA: res.a,
        desarrollo_puntaB: res.b,
        desarrollo_total: res.total,
        foto: fotoPlano,
      },
      logoEmpresa,
    );
    toast.success("PDF profesional exportado");
  };
  const tipoEfectivo: TipoPro = useMemo(() => {
    if (tipoTouched) return tipo;
    if (puntaGrandeRef && puntaPequenaRef) {
      const diff = Math.abs(puntaGrandeRef - puntaPequenaRef);
      return diff < 2 ? "recto_simetrico" : "conico_enchufable";
    }
    return tipo;
  }, [tipo, tipoTouched, puntaGrandeRef, puntaPequenaRef]);

  const updatePliegue = (
    setList: React.Dispatch<React.SetStateAction<Pliegue[]>>,
    id: string,
    field: keyof Omit<Pliegue, "id">,
    value: string,
  ) => setList((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));

  const addPliegue = (setList: React.Dispatch<React.SetStateAction<Pliegue[]>>) =>
    setList((prev) => [...prev, newPliegue()]);

  const removePliegue = (setList: React.Dispatch<React.SetStateAction<Pliegue[]>>, id: string) =>
    setList((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));

  const calcular = () => {
    const K = getK(material);
    const t = Number(espesor) || 0;

    let S = Number(solape) || 0;
    if (!S || S <= 0) {
      S = solapeAuto(t);
      setSolape(String(S));
    }

    let dA = 0;
    let dB = 0;

    if (tipoEfectivo === "recto_simetrico") {
      const base = calcularPunta(pliegues_base, K, t);
      dA = base;
      dB = base;
    } else if (tipoEfectivo === "recto_asimetrico" || tipoEfectivo === "conico_enchufable") {
      dA = calcularPunta(pliegues_puntaA, K, t);
      dB = calcularPunta(pliegues_puntaB, K, t);
    } else {
      const base = calcularPunta(pliegues_base.length ? pliegues_base : pliegues_puntaA, K, t);
      dA = base;
      dB = base;
    }

    const total = dA + dB + S;
    setRes({ a: dA, b: dB, total, solapeUsado: S });
    toast.success(`Desarrollo total: ${total.toFixed(2)} mm (solape ${S} mm)`);
  };

  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-300" />
          Modo profesional · pliegues por punta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid md:grid-cols-3 gap-3">
          <div className="space-y-2 md:col-span-1">
            <Label>Tipo de remate</Label>
            <Select
              value={tipoEfectivo}
              onValueChange={(v) => { setTipo(v as TipoPro); setTipoTouched(true); }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recto_simetrico">Recto simétrico</SelectItem>
                <SelectItem value="recto_asimetrico">Recto asimétrico</SelectItem>
                <SelectItem value="conico_enchufable">Cónico enchufable</SelectItem>
              </SelectContent>
            </Select>
            {!tipoTouched && (puntaGrandeRef || puntaPequenaRef) ? (
              <p className="text-[10px] text-muted-foreground">
                Detectado automáticamente. Cámbialo si quieres.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Material</Label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MATERIALS.map((m) => (
                  <SelectItem key={m} value={m}>{m} (K={getK(m).toFixed(2)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Espesor (mm)</Label>
              <Input type="number" inputMode="decimal" step="0.1" value={espesor} onChange={(e) => setEspesor(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Solape (mm)</Label>
              <Input type="number" inputMode="decimal" value={solape} onChange={(e) => setSolape(e.target.value)} placeholder="auto" />
            </div>
          </div>
        </div>

        {/* Foto del plano */}
        <div className="space-y-2">
          <Label>Foto del plano</Label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickFoto} className="hidden" />
          {fotoPlano ? (
            <div className="relative rounded-lg overflow-hidden border border-amber-500/30">
              <img src={fotoPlano} alt="Plano" className="w-full h-40 object-contain bg-black/40" />
              <button
                type="button"
                onClick={() => { setFotoPlano(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black"
                aria-label="Quitar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 h-24 rounded-lg border-2 border-dashed border-amber-500/40 bg-amber-500/5 text-amber-200 hover:bg-amber-500/10 transition"
            >
              <ImagePlus className="w-6 h-6" />
              <span className="text-sm font-medium">Tocar para añadir plano</span>
            </button>
          )}
        </div>

        {tipoEfectivo === "recto_simetrico" ? (
          <PliegueList
            titulo="Pliegues base (se aplica a ambas puntas)"
            color="amber"
            lista={pliegues_base}
            onChange={(id, f, v) => updatePliegue(setBase, id, f, v)}
            onAdd={() => addPliegue(setBase)}
            onRemove={(id) => removePliegue(setBase, id)}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <PliegueList
              titulo={tipoEfectivo === "conico_enchufable" ? "Punta A (grande)" : "Punta A"}
              color="sky"
              lista={pliegues_puntaA}
              onChange={(id, f, v) => updatePliegue(setA, id, f, v)}
              onAdd={() => addPliegue(setA)}
              onRemove={(id) => removePliegue(setA, id)}
            />
            <PliegueList
              titulo={tipoEfectivo === "conico_enchufable" ? "Punta B (pequeña)" : "Punta B"}
              color="emerald"
              lista={pliegues_puntaB}
              onChange={(id, f, v) => updatePliegue(setB, id, f, v)}
              onAdd={() => addPliegue(setB)}
              onRemove={(id) => removePliegue(setB, id)}
            />
          </div>
        )}

        <Button onClick={calcular} size="lg" className="w-full">
          <Calculator className="w-4 h-4 mr-2" />
          Calcular remate (pro)
        </Button>

        {res && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <ResultBox label="Desarrollo punta A" value={res.a} />
              <ResultBox label="Desarrollo punta B" value={res.b} />
              <ResultBox label="Total (con solape)" value={res.total} highlight subLabel={`solape ${res.solapeUsado} mm`} />
            </div>

            {/* Vista previa proporcional */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Vista previa del desarrollo</Label>
              <PreviewBar a={res.a} b={res.b} />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Punta A: <strong className="text-sky-300">{res.a.toFixed(2)} mm</strong></span>
                <span>Punta B: <strong className="text-emerald-300">{res.b.toFixed(2)} mm</strong></span>
                <span>Total: <strong className="text-amber-300">{res.total.toFixed(2)} mm</strong></span>
              </div>
            </div>

            <Button onClick={exportarPdf} size="lg" variant="outline" className="w-full border-amber-500/40 text-amber-200 hover:bg-amber-500/10">
              <FileDown className="w-4 h-4 mr-2" />
              Exportar PDF profesional
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PliegueList = ({
  titulo, color, lista, onChange, onAdd, onRemove,
}: {
  titulo: string;
  color: "sky" | "amber" | "emerald";
  lista: Pliegue[];
  onChange: (id: string, field: keyof Omit<Pliegue, "id">, value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) => {
  const border =
    color === "sky" ? "border-sky-500/30" :
    color === "amber" ? "border-amber-500/30" : "border-emerald-500/30";
  const text =
    color === "sky" ? "text-sky-300" :
    color === "amber" ? "text-amber-300" : "text-emerald-300";

  return (
    <div className={`rounded-lg border ${border} p-3 space-y-3`}>
      <div className="flex items-center justify-between">
        <h4 className={`text-sm font-semibold ${text}`}>{titulo}</h4>
        <Button size="sm" variant="ghost" onClick={onAdd} className={text}>
          <Plus className="w-4 h-4 mr-1" /> Pliegue
        </Button>
      </div>
      <div className="space-y-2">
        {lista.map((p, i) => (
          <div key={p.id} className="grid grid-cols-[24px_1fr_1fr_1fr_32px] gap-2 items-end">
            <span className="text-xs text-muted-foreground pb-2">#{i + 1}</span>
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Long.</Label>
              <Input type="number" inputMode="decimal" value={p.longitud_mm}
                onChange={(e) => onChange(p.id, "longitud_mm", e.target.value)} placeholder="mm" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Áng.</Label>
              <Input type="number" inputMode="decimal" value={p.angulo_deg}
                onChange={(e) => onChange(p.id, "angulo_deg", e.target.value)} placeholder="°" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Radio</Label>
              <Input type="number" inputMode="decimal" value={p.radio_mm}
                onChange={(e) => onChange(p.id, "radio_mm", e.target.value)} placeholder="mm" />
            </div>
            <Button size="icon" variant="ghost" onClick={() => onRemove(p.id)} disabled={lista.length <= 1}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ResultBox = ({
  label, value, highlight, subLabel,
}: { label: string; value: number; highlight?: boolean; subLabel?: string }) => (
  <div className={`p-3 rounded-lg border ${highlight ? "border-sky-500/40 bg-sky-500/10" : "border-border bg-muted/40"}`}>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className={`text-xl font-bold tabular-nums ${highlight ? "text-sky-300" : "text-foreground"}`}>
      {value.toFixed(2)} <span className="text-xs font-normal">mm</span>
    </div>
    {subLabel && <div className="text-[10px] text-muted-foreground mt-1">{subLabel}</div>}
  </div>
);

const PreviewBar = ({ a, b }: { a: number; b: number }) => {
  const total = (a || 0) + (b || 0);
  const pa = total > 0 ? (a / total) * 100 : 50;
  const pb = total > 0 ? (b / total) * 100 : 50;
  return (
    <div className="w-full h-8 rounded-md overflow-hidden flex border border-border bg-muted/20">
      <div
        className="h-full bg-sky-500/80 flex items-center justify-center text-[10px] font-semibold text-white"
        style={{ width: `${pa}%` }}
      >
        {pa > 12 ? "A" : ""}
      </div>
      <div
        className="h-full bg-emerald-500/80 flex items-center justify-center text-[10px] font-semibold text-white"
        style={{ width: `${pb}%` }}
      >
        {pb > 12 ? "B" : ""}
      </div>
    </div>
  );
};

export default RematesProfesional;
