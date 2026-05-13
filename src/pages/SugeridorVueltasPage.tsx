import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  AlertTriangle,
  Info,
  Sparkles,
  Loader2,
  ListOrdered,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { sugerirVueltas, type SugerirInput } from "@/lib/sugerirVueltas";

const SugeridorVueltasPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as Partial<SugerirInput> & { espesor?: number };

  const input: SugerirInput = useMemo(
    () => ({
      pliegues: state.pliegues || [],
      desarrolloTotal: state.desarrolloTotal ?? 0,
      desarrolloPuntaA: state.desarrolloPuntaA ?? 0,
      desarrolloPuntaB: state.desarrolloPuntaB ?? 0,
      material: state.material || "",
      remateDesigual: state.remateDesigual,
      validacion: state.validacion,
    }),
    [state]
  );

  const resultado = useMemo(() => sugerirVueltas(input), [input]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const online = typeof navigator !== "undefined" ? navigator.onLine : false;

  // Si la IA devuelve ordenRecomendado, reordenamos los pasos por ordenOriginal
  const pasosVisibles = useMemo(() => {
    const ai = aiResult?.ordenRecomendado;
    if (!Array.isArray(ai) || ai.length === 0) return resultado.pasos;
    const byOrig = new Map(resultado.pasos.map((p) => [p.ordenOriginal, p]));
    const reordenados: typeof resultado.pasos = [];
    ai.forEach((it: any) => {
      const orig = Number(it?.ordenOriginal ?? it?.orig ?? it?.paso);
      const found = byOrig.get(orig);
      if (found) {
        reordenados.push(found);
        byOrig.delete(orig);
      }
    });
    // añade los que la IA no haya mencionado al final, manteniendo su orden
    resultado.pasos.forEach((p) => {
      if (byOrig.has(p.ordenOriginal)) reordenados.push(p);
    });
    // recalcular giros y número de paso
    return reordenados.map((p, i) => ({
      ...p,
      paso: i + 1,
      requiereGiro: i > 0 && reordenados[i - 1].punta !== p.punta,
    }));
  }, [aiResult, resultado.pasos]);

  const ordenIAAplicado = pasosVisibles !== resultado.pasos;

  const callAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("sugerir-vueltas-ai", {
        body: {
          pliegues: input.pliegues,
          material: input.material,
          espesor: state.espesor ?? input.pliegues[0]?.espesor ?? 0,
          desarrolloTotal: input.desarrolloTotal,
          desarrolloPuntaA: input.desarrolloPuntaA,
          desarrolloPuntaB: input.desarrolloPuntaB,
          validacion: input.validacion,
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
          <ListOrdered className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Sugeridor de Vueltas</h1>
            <p className="text-sm text-muted-foreground">
              Orden recomendado para evitar choques · no es simulador 3D
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
      </header>

      {resultado.empezarPor && (
        <Alert>
          <AlertDescription>
            Remate desigual: <strong>empezar por la Punta {resultado.empezarPor}</strong> (lado más largo).
          </AlertDescription>
        </Alert>
      )}

      {/* Secuencia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Secuencia recomendada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {resultado.pasos.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin pliegues.</p>
          ) : (
            resultado.pasos.map((p) => (
              <div
                key={p.paso}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/30 text-sm"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge>{p.paso}</Badge>
                  <Badge variant="secondary">Punta {p.punta}</Badge>
                  <span className="text-muted-foreground">orig. #{p.ordenOriginal}</span>
                  {p.requiereGiro && (
                    <Badge variant="outline" className="border-amber-500/60 text-amber-600 dark:text-amber-400">
                      <RotateCw className="w-3 h-3 mr-1" /> Requiere giro
                    </Badge>
                  )}
                </div>
                <div className="text-right tabular-nums">
                  <div className="flex items-center gap-1 justify-end">
                    {p.orientacion === "up" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {p.angulo}° · {p.longitud} mm
                  </div>
                  <div className="text-xs text-muted-foreground">{p.motivo}</div>
                  {p.avisoChoque && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      ⚠ {p.avisoChoque}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Avisos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Avisos de choque
            <Badge variant="secondary" className="ml-2">
              {resultado.avisos.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          {resultado.avisos.length === 0 ? (
            <p className="text-muted-foreground italic">Sin avisos de choque.</p>
          ) : (
            resultado.avisos.map((a, i) => (
              <p key={i} className="text-amber-600 dark:text-amber-400">
                ⚠ {a}
              </p>
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
            <Sparkles className="w-4 h-4 text-primary" /> Sugerencia inteligente (IA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!online && (
            <Alert>
              <AlertDescription className="text-sm">
                Estás sin conexión. La sugerencia con IA solo funciona online.
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
              {(["ordenRecomendado", "giros", "avisosChoque", "observaciones"] as const).map((k) => {
                const arr = (aiResult?.[k] as any[]) || [];
                if (!arr || arr.length === 0) return null;
                return (
                  <div key={k}>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      {k}
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      {arr.map((s, i) => (
                        <li key={i}>{typeof s === "string" ? s : JSON.stringify(s)}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <Button
          onClick={() =>
            navigate("/remates-desiguales", {
              state: {
                ...state,
                pliegues: input.pliegues,
                material: input.material,
                desarrolloTotal: input.desarrolloTotal,
                desarrolloPuntaA: input.desarrolloPuntaA,
                desarrolloPuntaB: input.desarrolloPuntaB,
                validacion: input.validacion,
                sugerencia: resultado,
                sugerenciaIA: aiResult,
              },
            })
          }
        >
          Continuar <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default SugeridorVueltasPage;
