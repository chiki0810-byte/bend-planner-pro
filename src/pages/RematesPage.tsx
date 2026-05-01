import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, Calculator, FileSpreadsheet, ImagePlus, X, FileDown, Zap, Layers } from "lucide-react";
import { toast } from "sonner";
import { useRemates } from "@/state/RematesContext";
import { exportRemateExcel, exportRematePdf, RemateExportData } from "@/lib/rematesExport";
import logoEmpresa from "@/assets/logo_empresa.png";
import RematesProfesional from "@/components/RematesProfesional";

type TipoRemate = "recto" | "conico";

const MATERIALS = [
  { name: "Acero", k: 0.33 },
  { name: "Inox", k: 0.40 },
  { name: "Aluminio", k: 0.50 },
  { name: "Galvanizado", k: 0.33 },
  { name: "Corten", k: 0.33 },
  { name: "Duro 500", k: 0.33 },
  { name: "Duro 600", k: 0.33 },
  { name: "Latón", k: 0.45 },
  { name: "Cobre", k: 0.45 },
];

const getK = (material: string): number => {
  if (material.includes("Acero")) return 0.33;
  if (material.includes("Inox")) return 0.40;
  if (material.includes("Aluminio")) return 0.50;
  if (material.includes("Galvanizado")) return 0.33;
  if (material.includes("Corten")) return 0.33;
  if (material.includes("Duro 500")) return 0.33;
  if (material.includes("Duro 600")) return 0.33;
  if (material.includes("Latón")) return 0.45;
  if (material.includes("Cobre")) return 0.45;
  return 0.33;
};

interface Resultados {
  derecha: number;
  izquierda: number;
  puntaA: number;
  puntaB: number;
  total: number;
}

const fmt = (n: number) => (n ? n.toFixed(2) : "—");

const RematesPage = () => {
  const [modoRapido, setModoRapido] = useState(false);
  const [modoPro, setModoPro] = useState(false);
  const [tipoRemate, setTipoRemate] = useState<TipoRemate>("recto");
  const [material, setMaterial] = useState<string>("Acero");
  const [medidaDerecha, setMedidaDerecha] = useState<string>("");
  const [medidaIzquierda, setMedidaIzquierda] = useState<string>("");
  const [puntaGrande, setPuntaGrande] = useState<string>("");
  const [puntaPequena, setPuntaPequena] = useState<string>("");
  const [altura, setAltura] = useState<string>("");
  const [espesor, setEspesor] = useState<string>("");
  const [solape, setSolape] = useState<string>("");
  const [res, setRes] = useState<Resultados | null>(null);
  const [fotoPlano, setFotoPlano] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { add } = useRemates();

  // En modo rápido siempre forzamos cónico
  const tipoEfectivo: TipoRemate = modoRapido ? "conico" : tipoRemate;

  const onPickFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFotoPlano(reader.result as string);
    reader.readAsDataURL(file);
  };

  const buildExportData = (r: Resultados): RemateExportData => ({
    tipo: tipoEfectivo,
    material,
    espesor: Number(espesor) || 0,
    solape: modoRapido ? 0 : (Number(solape) || 0),
    medidaDerecha: modoRapido ? 0 : (Number(medidaDerecha) || 0),
    medidaIzquierda: modoRapido ? 0 : (Number(medidaIzquierda) || 0),
    puntaGrande: Number(puntaGrande) || 0,
    puntaPequena: Number(puntaPequena) || 0,
    altura: modoRapido ? 0 : (Number(altura) || 0),
    desarrollo_derecha: r.derecha,
    desarrollo_izquierda: r.izquierda,
    desarrollo_puntaA: r.puntaA,
    desarrollo_puntaB: r.puntaB,
    desarrollo_total: r.total,
    foto: modoRapido ? null : fotoPlano,
  });

  const exportarExcel = () => {
    if (!res) { toast.error("Calcula primero"); return; }
    exportRemateExcel(buildExportData(res));
    toast.success("Excel exportado");
  };

  const exportarPdf = async () => {
    if (!res) { toast.error("Calcula primero"); return; }
    await exportRematePdf(buildExportData(res), logoEmpresa);
    toast.success("PDF exportado");
  };

  const calcular = () => {
    const K = getK(material);

    const DR = modoRapido ? 0 : (Number(medidaDerecha) || 0);
    const IZ = modoRapido ? 0 : (Number(medidaIzquierda) || 0);
    const A = Number(puntaGrande) || 0;
    const B = Number(puntaPequena) || 0;
    const t = Number(espesor) || 0;
    const S = modoRapido ? 0 : (Number(solape) || 0);

    const corr = 2 * Math.PI * K * t;

    let desarrolloDerecha = 0;
    let desarrolloIzquierda = 0;
    let desarrolloPuntaA = 0;
    let desarrolloPuntaB = 0;
    let desarrolloTotal = 0;

    if (tipoEfectivo === "recto") {
      desarrolloDerecha = DR + corr;
      desarrolloIzquierda = IZ + corr;
      desarrolloTotal = desarrolloDerecha + desarrolloIzquierda + S;
    } else {
      desarrolloPuntaA = A + corr;
      desarrolloPuntaB = B + corr;
      desarrolloTotal = desarrolloPuntaA + desarrolloPuntaB + S;
    }

    const r: Resultados = {
      derecha: desarrolloDerecha,
      izquierda: desarrolloIzquierda,
      puntaA: desarrolloPuntaA,
      puntaB: desarrolloPuntaB,
      total: desarrolloTotal,
    };
    setRes(r);

    // Guardar al historial
    add({
      tipo: tipoEfectivo,
      derecha: DR,
      izquierda: IZ,
      puntaA: A,
      puntaB: B,
      altura: modoRapido ? 0 : (Number(altura) || 0),
      espesor: t,
      material,
      solape: S,
      desarrollo_derecha: desarrolloDerecha,
      desarrollo_izquierda: desarrolloIzquierda,
      desarrollo_puntaA: desarrolloPuntaA,
      desarrollo_puntaB: desarrolloPuntaB,
      desarrollo_total: desarrolloTotal,
      foto: modoRapido ? null : fotoPlano,
    });

    toast.success(`Desarrollo total: ${desarrolloTotal.toFixed(2)} mm`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
              <Scissors className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Remates</h1>
              <p className="text-sm text-muted-foreground">
                Cálculo de desarrollo para remates rectos y cónicos
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${modoRapido ? "border-amber-500/40 bg-amber-500/10" : "border-sky-500/20 bg-sky-500/5"}`}>
            <Zap className={`w-4 h-4 ${modoRapido ? "text-amber-300" : "text-sky-400"}`} />
            <Label htmlFor="modo-rapido" className="text-sm cursor-pointer">Modo rápido</Label>
            <Switch id="modo-rapido" checked={modoRapido} onCheckedChange={setModoRapido} />
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-sky-500/20">
            <CardHeader>
              <CardTitle className="text-lg">Parámetros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!modoRapido && (
                <div className="space-y-2">
                  <Label>Foto del plano</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onPickFoto}
                    className="hidden"
                  />
                  {fotoPlano ? (
                    <div className="relative rounded-lg overflow-hidden border border-sky-500/30">
                      <img src={fotoPlano} alt="Plano" className="w-full h-48 object-contain bg-black/40" />
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
                      className="w-full flex flex-col items-center justify-center gap-2 h-32 rounded-lg border-2 border-dashed border-sky-500/40 bg-sky-500/5 text-sky-300 hover:bg-sky-500/10 transition"
                    >
                      <ImagePlus className="w-7 h-7" />
                      <span className="text-sm font-medium">Tocar para añadir plano</span>
                      <span className="text-[10px] uppercase tracking-wider text-sky-400/70">
                        Cámara · Galería · Archivos
                      </span>
                    </button>
                  )}
                </div>
              )}

              {!modoRapido && (
                <div className="space-y-2">
                  <Label>Tipo de remate</Label>
                  <Select value={tipoRemate} onValueChange={(v) => setTipoRemate(v as TipoRemate)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recto">Recto</SelectItem>
                      <SelectItem value="conico">Cónico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Material</Label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MATERIALS.map((m) => (
                      <SelectItem key={m.name} value={m.name}>
                        {m.name} (K={m.k.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!modoRapido && tipoRemate === "recto" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Medida derecha (mm)</Label>
                    <Input type="number" inputMode="decimal" value={medidaDerecha} onChange={(e) => setMedidaDerecha(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Medida izquierda (mm)</Label>
                    <Input type="number" inputMode="decimal" value={medidaIzquierda} onChange={(e) => setMedidaIzquierda(e.target.value)} placeholder="0" />
                  </div>
                </div>
              )}

              {(modoRapido || tipoRemate === "conico") && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Punta grande (mm)</Label>
                    <Input type="number" inputMode="decimal" value={puntaGrande} onChange={(e) => setPuntaGrande(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Punta pequeña (mm)</Label>
                    <Input type="number" inputMode="decimal" value={puntaPequena} onChange={(e) => setPuntaPequena(e.target.value)} placeholder="0" />
                  </div>
                  {!modoRapido && (
                    <div className="space-y-2 col-span-2">
                      <Label>Altura (mm)</Label>
                      <Input type="number" inputMode="decimal" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="0" />
                    </div>
                  )}
                </div>
              )}

              <div className={`grid ${modoRapido ? "grid-cols-1" : "grid-cols-2"} gap-3`}>
                <div className="space-y-2">
                  <Label>Espesor (mm)</Label>
                  <Input type="number" inputMode="decimal" step="0.1" value={espesor} onChange={(e) => setEspesor(e.target.value)} placeholder="0" />
                </div>
                {!modoRapido && (
                  <div className="space-y-2">
                    <Label>Solape (mm)</Label>
                    <Input type="number" inputMode="decimal" value={solape} onChange={(e) => setSolape(e.target.value)} placeholder="0" />
                  </div>
                )}
              </div>

              <Button onClick={calcular} size="lg" className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Calcular remate
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={exportarExcel} size="lg" variant="outline" className="border-sky-500/40 text-sky-200 hover:bg-sky-500/10">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button onClick={exportarPdf} size="lg" variant="outline" className="border-sky-500/40 text-sky-200 hover:bg-sky-500/10">
                  <FileDown className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sky-500/20">
            <CardHeader>
              <CardTitle className="text-lg">Resultados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {modoRapido ? (
                <>
                  <ResultRow label="Desarrollo punta A" value={fmt(res?.puntaA ?? 0)} />
                  <ResultRow label="Desarrollo punta B" value={fmt(res?.puntaB ?? 0)} />
                </>
              ) : tipoRemate === "recto" ? (
                <>
                  <ResultRow label="Desarrollo derecha" value={fmt(res?.derecha ?? 0)} />
                  <ResultRow label="Desarrollo izquierda" value={fmt(res?.izquierda ?? 0)} />
                </>
              ) : (
                <>
                  <ResultRow label="Desarrollo punta grande" value={fmt(res?.puntaA ?? 0)} />
                  <ResultRow label="Desarrollo punta pequeña" value={fmt(res?.puntaB ?? 0)} />
                </>
              )}
              <div className="pt-3 border-t border-sky-500/20">
                <div className="flex items-baseline justify-between p-4 rounded-lg bg-sky-500/10 border border-sky-500/30">
                  <span className="text-sm font-semibold text-sky-200">Desarrollo total</span>
                  <span className="text-2xl font-bold text-sky-300 tabular-nums">
                    {fmt(res?.total ?? 0)} <span className="text-sm font-normal">mm</span>
                  </span>
                </div>
              </div>
              {!res && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Introduce los valores y pulsa "Calcular remate".
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ResultRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between p-3 rounded-md bg-muted/40">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="font-mono font-semibold tabular-nums">{value} mm</span>
  </div>
);

export default RematesPage;
