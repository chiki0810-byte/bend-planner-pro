import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scissors, Calculator } from "lucide-react";
import { toast } from "sonner";

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

  const calcular = () => {
    const K = getK(material);

    const DR = Number(medidaDerecha) || 0;
    const IZ = Number(medidaIzquierda) || 0;
    const A = Number(puntaGrande) || 0;
    const B = Number(puntaPequena) || 0;
    // const H = Number(altura) || 0; // reservado
    const t = Number(espesor) || 0;
    const S = Number(solape) || 0;

    const corr = 2 * Math.PI * K * t;

    let desarrolloDerecha = 0;
    let desarrolloIzquierda = 0;
    let desarrolloPuntaA = 0;
    let desarrolloPuntaB = 0;
    let desarrolloTotal = 0;

    if (tipoRemate === "recto") {
      desarrolloDerecha = DR + corr;
      desarrolloIzquierda = IZ + corr;
      desarrolloTotal = desarrolloDerecha + desarrolloIzquierda + S;
    } else {
      desarrolloPuntaA = A + corr;
      desarrolloPuntaB = B + corr;
      desarrolloTotal = desarrolloPuntaA + desarrolloPuntaB + S;
    }

    setRes({
      derecha: desarrolloDerecha,
      izquierda: desarrolloIzquierda,
      puntaA: desarrolloPuntaA,
      puntaB: desarrolloPuntaB,
      total: desarrolloTotal,
    });

    toast.success(`Desarrollo total: ${desarrolloTotal.toFixed(2)} mm`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
            <Scissors className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Remates</h1>
            <p className="text-sm text-muted-foreground">
              Cálculo de desarrollo para remates rectos y cónicos
            </p>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-sky-500/20">
            <CardHeader>
              <CardTitle className="text-lg">Parámetros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              {tipoRemate === "recto" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Medida derecha (mm)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={medidaDerecha}
                      onChange={(e) => setMedidaDerecha(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Medida izquierda (mm)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={medidaIzquierda}
                      onChange={(e) => setMedidaIzquierda(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              {tipoRemate === "conico" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Punta grande (mm)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={puntaGrande}
                      onChange={(e) => setPuntaGrande(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Punta pequeña (mm)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={puntaPequena}
                      onChange={(e) => setPuntaPequena(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Altura (mm)</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Espesor (mm)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={espesor}
                    onChange={(e) => setEspesor(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Solape (mm)</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={solape}
                    onChange={(e) => setSolape(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <Button onClick={calcular} size="lg" className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Calcular remate
              </Button>
            </CardContent>
          </Card>

          <Card className="border-sky-500/20">
            <CardHeader>
              <CardTitle className="text-lg">Resultados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tipoRemate === "recto" ? (
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
