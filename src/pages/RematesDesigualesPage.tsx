import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Scissors,
  AlertTriangle,
  Sparkles,
  Loader2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  calcularRemateDesigual,
  type RemateInput,
  type TipoRemate,
} from "@/lib/calcularRemateDesigual";

const num = (v: unknown, d = 0) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : d;
};

const RematesDesigualesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as any;

  // Inferencia desde BLOQUE 5
  const inferAlaA = num(
    state?.desarrolloPuntaA ?? state?.pliegues?.[0]?.longitud,
    50
  );
  const inferAlaB = num(
    state?.desarrolloPuntaB ?? state?.pliegues?.[state?.pliegues?.length - 1]?.longitud,
    40
  );
  const inferAngulo = num(state?.pliegues?.[0]?.angulo, 90);
  const inferEspesor = num(state?.espesor ?? state?.pliegues?.[0]?.espesor, 1);
  const inferRadio = num(state?.radio ?? state?.pliegues?.[0]?.radio, 1);

  const [alaA, setAlaA] = useState<number>(inferAlaA);
  const [alaB, setAlaB] = useState<number>(inferAlaB);
  const [espesor, setEspesor] = useState<number>(inferEspesor);
  const [radio, setRadio] = useState<number>(inferRadio);
  const [angulo, setAngulo] = useState<number>(inferAngulo);
  const [material, setMaterial] = useState<string>(state?.material || "");
  const [tipo, setTipo] = useState<TipoRemate>("normal");
  const longitudTotal = useMemo(() => alaA + alaB, [alaA, alaB]);

  const input: RemateInput = useMemo(
    () => ({
      longitudTotal,
      alaA,
      alaB,
      espesor,
      radio,
      angulo,
      material,
      tipo,
      validacion: state?.validacion,
    }),
    [longitudTotal, alaA, alaB, espesor, radio, angulo, material, tipo, state?.validacion]
  );

  const resultado = useMemo(() => calcularRemateDesigual(input), [input]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const online = typeof navigator !== "undefined" ? navigator.onLine : false;

  const callAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("remate-desigual-ai", {
        body: {
          alaA,
          alaB,
          espesor,
          radio,
          angulo,
          material,
          tipo,
          longitudTotal,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAiResult((data as any)?.ai || null);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Scissors className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Remates Desiguales</h1>
            <p className="text-sm text-muted-foreground">
              Cálculo avanzado para alas A/B distintas y corte cejo
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
      </header>

      {/* Datos de entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del remate</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label>Ala A (mm)</Label>
            <Input type="number" value={alaA} onChange={(e) => setAlaA(num(e.target.value))} />
          </div>
          <div>
            <Label>Ala B (mm)</Label>
            <Input type="number" value={alaB} onChange={(e) => setAlaB(num(e.target.value))} />
          </div>
          <div>
            <Label>Espesor (mm)</Label>
            <Input type="number" step="0.1" value={espesor} onChange={(e) => setEspesor(num(e.target.value))} />
          </div>
          <div>
            <Label>Radio (mm)</Label>
            <Input type="number" step="0.1" value={radio} onChange={(e) => setRadio(num(e.target.value))} />
          </div>
          <div>
            <Label>Ángulo (°)</Label>
            <Input type="number" value={angulo} onChange={(e) => setAngulo(num(e.target.value))} />
          </div>
          <div>
            <Label>Material</Label>
            <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Ej. Acero galv." />
          </div>
          <div>
            <Label>Tipo de remate</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRemate)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="cejo">Corte cejo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Longitud total (mm)</Label>
            <Input type="number" value={longitudTotal} readOnly />
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultados</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <Stat label="BA" value={`${resultado.ba} mm`} />
          <Stat label="BD" value={`${resultado.bd} mm`} />
          <Stat label="K dinámico" value={`${resultado.kDinamico}`} />
          <Stat label="Corrección longitud" value={`${resultado.correccionLongitud} mm`} />
          <Stat label="Reducción cejo" value={`${resultado.reduccionCejo} mm`} />
          <Stat label="Ala A final" value={`${resultado.alaAFinal} mm`} />
          <Stat label="Ala B final" value={`${resultado.alaBFinal} mm`} />
          <Stat
            label="Desarrollo total"
            value={`D:${resultado.desarrolloTotal}`}
            highlight
          />
        </CardContent>
      </Card>

      {/* Avisos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Avisos industriales
            <Badge variant="secondary" className="ml-2">
              {resultado.avisos.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {resultado.avisos.length === 0 ? (
            <p className="text-muted-foreground italic">Sin avisos.</p>
          ) : (
            resultado.avisos.map((a, i) => (
              <p
                key={i}
                className={
                  a.nivel === "error"
                    ? "text-destructive"
                    : a.nivel === "warn"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
                }
              >
                {a.nivel === "error" ? "✕" : a.nivel === "warn" ? "⚠" : "ℹ"} {a.mensaje}
              </p>
            ))
          )}
        </CardContent>
      </Card>

      {/* IA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Análisis inteligente (IA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!online && (
            <Alert>
              <AlertDescription className="text-sm">
                Estás sin conexión. El análisis con IA solo funciona online.
              </AlertDescription>
            </Alert>
          )}
          <Button onClick={callAI} disabled={!online || aiLoading}>
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analizando…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" /> Analizar con IA
              </>
            )}
          </Button>
          {aiError && (
            <Alert className="border-destructive/50 text-destructive">
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
          )}
          {aiResult && (
            <div className="text-sm space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["ba", "bd", "kDinamico", "correccionLongitud"].map((k) =>
                  aiResult[k] !== undefined ? (
                    <Stat key={k} label={`IA · ${k}`} value={String(aiResult[k])} />
                  ) : null
                )}
              </div>
              {Array.isArray(aiResult.avisos) && aiResult.avisos.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Avisos IA
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {aiResult.avisos.map((s: any, i: number) => (
                      <li key={i}>{typeof s === "string" ? s : JSON.stringify(s)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <Button disabled>
          Continuar <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

const Stat = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <div
    className={`p-3 rounded-lg border ${
      highlight ? "bg-primary/10 border-primary/40" : "bg-muted/30"
    }`}
  >
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`tabular-nums font-semibold ${highlight ? "text-primary text-lg" : ""}`}>
      {value}
    </div>
  </div>
);

export default RematesDesigualesPage;
