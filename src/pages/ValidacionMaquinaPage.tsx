import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShieldCheck, AlertTriangle, Info, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import {
  validarPieza,
  type ValidacionInput,
  type ValidacionResultado,
  type Aviso,
} from "@/lib/validarPieza";

interface NavState extends Partial<ValidacionInput> {
  espesor?: number;
}

const nivelStyle = (n: Aviso["nivel"]) =>
  n === "error"
    ? "border-destructive/50 text-destructive"
    : n === "warn"
    ? "border-amber-500/50 text-amber-600 dark:text-amber-400"
    : "border-sky-500/40 text-sky-600 dark:text-sky-300";

const ValidacionMaquinaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as NavState;

  const input: ValidacionInput = useMemo(
    () => ({
      pliegues: state.pliegues || [],
      desarrolloTotal: state.desarrolloTotal ?? 0,
      desarrolloPuntaA: state.desarrolloPuntaA ?? 0,
      desarrolloPuntaB: state.desarrolloPuntaB ?? 0,
      material: state.material || "",
      remateDesigual: state.remateDesigual,
    }),
    [state]
  );

  const resultado: ValidacionResultado = useMemo(() => validarPieza(input), [input]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const online = typeof navigator !== "undefined" ? navigator.onLine : false;

  const callAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("validar-pieza-ai", {
        body: {
          pliegues: input.pliegues,
          material: input.material,
          espesor: state.espesor ?? input.pliegues[0]?.espesor ?? 0,
          desarrolloTotal: input.desarrolloTotal,
          desarrolloPuntaA: input.desarrolloPuntaA,
          desarrolloPuntaB: input.desarrolloPuntaB,
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

  useEffect(() => {
    // No auto-llamar a IA — el usuario decide y solo si está online.
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Validación de Máquina</h1>
            <p className="text-sm text-muted-foreground">
              Avisos industriales · no sustituye a un software profesional
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
      </header>

      {/* Avisos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Avisos
            <Badge variant="secondary" className="ml-2">
              {resultado.avisos.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {resultado.avisos.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin avisos. Pieza válida según reglas básicas.</p>
          ) : (
            resultado.avisos.map((a, i) => (
              <Alert key={i} className={nivelStyle(a.nivel)}>
                <AlertTitle className="text-sm font-semibold uppercase tracking-wide">
                  {a.nivel} · {a.codigo}
                </AlertTitle>
                <AlertDescription className="text-sm">{a.mensaje}</AlertDescription>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>

      {/* Orden recomendado */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Orden recomendado de pliegues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {resultado.ordenRecomendado.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin pliegues.</p>
          ) : (
            resultado.ordenRecomendado.map((o) => (
              <div
                key={o.ordenRecomendado}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge>{o.ordenRecomendado}</Badge>
                  <Badge variant="secondary">Punta {o.punta}</Badge>
                  <span className="text-muted-foreground">orig. #{o.ordenOriginal}</span>
                </div>
                <div className="text-right tabular-nums">
                  <div>
                    {o.angulo}° · {o.longitud} mm
                  </div>
                  <div className="text-xs text-muted-foreground">{o.motivo}</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Observaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4" /> Observaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          {resultado.observaciones.map((o, i) => (
            <p key={i}>{o}</p>
          ))}
        </CardContent>
      </Card>

      {/* IA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Validación inteligente (IA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!online && (
            <Alert>
              <AlertDescription className="text-sm">
                Estás sin conexión. La validación con IA solo funciona online.
              </AlertDescription>
            </Alert>
          )}
          <Button onClick={callAI} disabled={!online || aiLoading || input.pliegues.length === 0}>
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
            <div className="space-y-3 text-sm">
              {(["avisosAlasCortas", "angulosImposibles", "choquesEvidentes", "ordenRecomendado", "observaciones"] as const).map(
                (k) => {
                  const arr = (aiResult?.[k] as string[]) || [];
                  if (arr.length === 0) return null;
                  return (
                    <div key={k}>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{k}</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {arr.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <Button
          onClick={() =>
            navigate("/sugeridor-vueltas", {
              state: {
                pliegues: input.pliegues,
                desarrolloTotal: input.desarrolloTotal,
                desarrolloPuntaA: input.desarrolloPuntaA,
                desarrolloPuntaB: input.desarrolloPuntaB,
                material: input.material,
                remateDesigual: input.remateDesigual,
                espesor: state.espesor,
                validacion: resultado,
              },
            })
          }
          disabled={input.pliegues.length === 0}
        >
          Continuar <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default ValidacionMaquinaPage;
