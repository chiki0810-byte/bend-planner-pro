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
  Plus,
  Trash2,
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
  type PliegueFisico,
} from "@/lib/calcularRemateDesigual";

const num = (v: unknown, d = 0) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : d;
};

const uid = () => Math.random().toString(36).slice(2, 9);

type RemateSegmento = {
  id: string;
  longitud: number;
  referencia: "inside" | "outside";
};

type RematePliegue = {
  id: string;
  angulo: number;
  radio: number;
  direccion: "up" | "down";
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

  const [espesor, setEspesor] = useState<number>(inferEspesor);
  const [material, setMaterial] = useState<string>(state?.material || "");
  const [tipo, setTipo] = useState<TipoRemate>("normal");

  // Estado por tramos: arranca con 2 tramos y 1 pliegue
  const [segmentos, setSegmentos] = useState<RemateSegmento[]>([
    { id: uid(), longitud: inferAlaA, referencia: "outside" },
    { id: uid(), longitud: inferAlaB, referencia: "outside" },
  ]);
  const [pliegues, setPliegues] = useState<RematePliegue[]>([
    { id: uid(), angulo: inferAngulo, radio: inferRadio, direccion: "up" },
  ]);

  const addTramo = () => {
    setSegmentos((s) => [...s, { id: uid(), longitud: 0, referencia: "outside" }]);
    setPliegues((p) => [
      ...p,
      { id: uid(), angulo: 90, radio: inferRadio, direccion: "up" },
    ]);
  };

  const removeTramo = (index: number) => {
    if (segmentos.length <= 2) return; // n pliegues = n tramos - 1, mínimo 2 tramos
    setSegmentos((s) => s.filter((_, i) => i !== index));
    setPliegues((p) => {
      const idx = Math.min(index, p.length - 1);
      return p.filter((_, i) => i !== idx);
    });
  };

  const updSegmento = (id: string, patch: Partial<RemateSegmento>) =>
    setSegmentos((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const updPliegue = (id: string, patch: Partial<RematePliegue>) =>
    setPliegues((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const sumaTramos = useMemo(
    () => +segmentos.reduce((a, s) => a + s.longitud, 0).toFixed(3),
    [segmentos]
  );

  const alaA = segmentos[0]?.longitud ?? 0;
  const alaB = segmentos[segmentos.length - 1]?.longitud ?? 0;

  const plieguesFisicos: PliegueFisico[] = useMemo(
    () =>
      pliegues.map((p) => ({
        angulo: p.angulo,
        radio: p.radio,
        espesor,
      })),
    [pliegues, espesor]
  );

  const input: RemateInput = useMemo(
    () => ({
      longitudTotal: sumaTramos,
      alaA,
      alaB,
      espesor,
      radio: pliegues[0]?.radio ?? inferRadio,
      angulo: pliegues[0]?.angulo ?? inferAngulo,
      material,
      tipo,
      pliegues: plieguesFisicos,
      sumaTramos,
      validacion: state?.validacion,
    }),
    [sumaTramos, alaA, alaB, espesor, pliegues, plieguesFisicos, material, tipo, inferRadio, inferAngulo, state?.validacion]
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
          radio: input.radio,
          angulo: input.angulo,
          material,
          tipo,
          longitudTotal: sumaTramos,
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
              Tramos y pliegues individuales (cada pliegue con su ángulo y radio)
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
      </header>

      {/* Datos globales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <Label>Espesor (mm)</Label>
            <Input type="number" step="0.1" value={espesor} onChange={(e) => setEspesor(num(e.target.value))} />
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
        </CardContent>
      </Card>

      {/* Tramos y pliegues */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Tramos y pliegues</CardTitle>
          <Button size="sm" onClick={addTramo}>
            <Plus className="w-4 h-4 mr-1" /> Añadir tramo
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {segmentos.map((s, i) => (
            <div key={s.id} className="space-y-3">
              <div className="p-3 rounded-lg border bg-muted/20 grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                <div className="md:col-span-1">
                  <Label>Tramo {i + 1} (mm)</Label>
                  <Input
                    type="number"
                    value={s.longitud}
                    onChange={(e) => updSegmento(s.id, { longitud: num(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Referencia</Label>
                  <Select
                    value={s.referencia}
                    onValueChange={(v) => updSegmento(s.id, { referencia: v as "inside" | "outside" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inside">Interior</SelectItem>
                      <SelectItem value="outside">Exterior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTramo(i)}
                    disabled={segmentos.length <= 2}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Eliminar tramo
                  </Button>
                </div>
              </div>

              {i < pliegues.length && (
                <div className="ml-4 p-3 rounded-lg border border-primary/30 bg-primary/5 grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                  <div className="text-sm font-medium md:col-span-1">
                    Pliegue {i + 1}
                    <div className="text-xs text-muted-foreground tabular-nums">
                      BA: {resultado.baPorPliegue?.[i] ?? 0} mm
                    </div>
                  </div>
                  <div>
                    <Label>Ángulo (°)</Label>
                    <Input
                      type="number"
                      value={pliegues[i].angulo}
                      onChange={(e) => updPliegue(pliegues[i].id, { angulo: num(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Radio (mm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={pliegues[i].radio}
                      onChange={(e) => updPliegue(pliegues[i].id, { radio: num(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Dirección</Label>
                    <Select
                      value={pliegues[i].direccion}
                      onValueChange={(v) => updPliegue(pliegues[i].id, { direccion: v as "up" | "down" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up">↑ Arriba</SelectItem>
                        <SelectItem value="down">↓ Abajo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Resumen visual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <Stat label="Número de tramos" value={`${segmentos.length}`} />
          <Stat label="Número de pliegues" value={`${pliegues.length}`} />
          <Stat label="Suma de tramos" value={`${sumaTramos} mm`} />
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultados</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <Stat label="BA total" value={`${resultado.ba} mm`} />
          <Stat label="BD" value={`${resultado.bd} mm`} />
          <Stat label="K dinámico" value={`${resultado.kDinamico}`} />
          <Stat label="Corrección longitud" value={`${resultado.correccionLongitud} mm`} />
          <Stat label="Reducción cejo" value={`${resultado.reduccionCejo} mm`} />
          <Stat label="Tramos rectos" value={`${resultado.desglose?.tramosRectos ?? 0} mm`} />
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
