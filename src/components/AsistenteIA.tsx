import { useEffect, useState } from "react";
import { Sparkles, Wifi, WifiOff, Loader2, Copy, AlertTriangle, Wrench, Zap, ListChecks, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MATERIALES = [
  "Acero S235",
  "Acero S275",
  "Inox 304",
  "Inox 316",
  "Aluminio 5754",
  "Aluminio 6082",
  "Galvanizado",
  "Acero Corten",
  "Acero Duro 500",
  "Acero Duro 600",
  "Latón",
  "Cobre",
];

const ESPESORES = ["0.5", "0.6", "0.8", "1.0", "1.2", "1.5", "2.0", "2.5", "3.0", "4.0", "5.0", "6.0", "8.0", "10.0"];

const MAQUINAS = ["Stefa 8 m", "Jordi PH6100-180 (180 t)", "Prensa 6 m"];

interface Resultado {
  angulo_compensado: string;
  fuerza_necesaria: string;
  pasos_operacion: string;
  advertencias: string;
  notas_tecnicas: string;
}

const AsistenteIA = () => {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [material, setMaterial] = useState("Acero S275");
  const [espesor, setEspesor] = useState("1.5");
  const [longitud, setLongitud] = useState("1000");
  const [angulo, setAngulo] = useState("90");
  const [maquina, setMaquina] = useState(MAQUINAS[0]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  const consultar = async () => {
    if (!online) {
      toast.error("Esta función requiere internet. No disponible en modo taller offline.");
      return;
    }
    if (!material || !espesor || !longitud || !angulo || !maquina) {
      toast.error("Completa todos los campos");
      return;
    }
    setLoading(true);
    setResultado(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-plegado-asistente", {
        body: { material, espesor, longitud, angulo, maquina },
      });
      if (error) {
        const ctx = (error as { context?: { status?: number } }).context;
        if (ctx?.status === 429) toast.error("Demasiadas peticiones. Espera un momento.");
        else if (ctx?.status === 402) toast.error("Sin créditos de IA. Añade fondos en tu workspace.");
        else toast.error(error.message || "Error consultando la IA");
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setResultado(data as Resultado);
      toast.success("Recomendación generada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error de red");
    } finally {
      setLoading(false);
    }
  };

  const copiar = async () => {
    if (!resultado) return;
    const texto = `ASISTENTE IA - PLEGADO
Material: ${material} | Espesor: ${espesor} mm | Longitud: ${longitud} mm | Ángulo: ${angulo}° | Máquina: ${maquina}

Ángulo compensado:
${resultado.angulo_compensado}

Fuerza necesaria:
${resultado.fuerza_necesaria}

Pasos de operación:
${resultado.pasos_operacion}

Advertencias:
${resultado.advertencias}

Notas técnicas:
${resultado.notas_tecnicas}`;
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Resultado copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-sky-500" />
          Asistente IA de Plegado
        </h1>
        <Badge
          variant="outline"
          className={online ? "border-emerald-500/40 text-emerald-600" : "border-amber-500/40 text-amber-600"}
        >
          {online ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
          {online ? "Online" : "Offline"}
        </Badge>
      </div>

      <Card className="p-3 bg-amber-50 border-amber-200 text-amber-900 text-sm dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800">
        <div className="flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Función opcional <strong>solo online</strong>. El resto de la app funciona 100% offline.
            En .apk/.exe sin conexión, esta pestaña queda deshabilitada.
          </span>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Material</Label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MATERIALES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Espesor (mm)</Label>
            <Select value={espesor} onValueChange={setEspesor}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ESPESORES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Longitud (mm)</Label>
            <Input type="number" inputMode="numeric" value={longitud} onChange={(e) => setLongitud(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Ángulo (°)</Label>
            <Input type="number" inputMode="numeric" value={angulo} onChange={(e) => setAngulo(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Máquina</Label>
            <Select value={maquina} onValueChange={setMaquina}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MAQUINAS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={consultar}
          disabled={loading || !online}
          className="w-full h-12 text-base font-semibold bg-gradient-to-b from-sky-500 to-blue-700 hover:from-sky-400 hover:to-blue-600"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Consultando IA…</>
          ) : (
            <><Sparkles className="w-5 h-5 mr-2" /> Consultar IA</>
          )}
        </Button>
        {!online && (
          <p className="text-xs text-amber-600 text-center">Sin conexión. Conéctate a internet para usar el asistente.</p>
        )}
      </Card>

      {resultado && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={copiar}>
              <Copy className="w-4 h-4 mr-2" /> Copiar resultado
            </Button>
          </div>

          <ResultCard icon={<Wrench className="w-5 h-5" />} title="Ángulo compensado" tone="sky">
            {resultado.angulo_compensado}
          </ResultCard>
          <ResultCard icon={<Zap className="w-5 h-5" />} title="Fuerza necesaria" tone="violet">
            {resultado.fuerza_necesaria}
          </ResultCard>
          <ResultCard icon={<ListChecks className="w-5 h-5" />} title="Pasos de operación" tone="emerald">
            {resultado.pasos_operacion}
          </ResultCard>
          <ResultCard icon={<AlertTriangle className="w-5 h-5" />} title="Advertencias" tone="amber">
            {resultado.advertencias}
          </ResultCard>
          <ResultCard icon={<BookOpen className="w-5 h-5" />} title="Notas técnicas" tone="slate">
            {resultado.notas_tecnicas}
          </ResultCard>
        </div>
      )}
    </div>
  );
};

const TONES: Record<string, string> = {
  sky: "border-sky-500/30 bg-sky-50 dark:bg-sky-950/20",
  violet: "border-violet-500/30 bg-violet-50 dark:bg-violet-950/20",
  emerald: "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20",
  amber: "border-amber-500/40 bg-amber-50 dark:bg-amber-950/20",
  slate: "border-slate-500/30 bg-slate-50 dark:bg-slate-950/20",
};

const ResultCard = ({
  icon, title, tone, children,
}: { icon: React.ReactNode; title: string; tone: keyof typeof TONES | string; children: React.ReactNode }) => (
  <Card className={`p-4 ${TONES[tone] || ""}`}>
    <div className="flex items-center gap-2 font-semibold mb-2">
      {icon}
      <span>{title}</span>
    </div>
    <div className="text-sm whitespace-pre-wrap leading-relaxed">{children}</div>
  </Card>
);

export default AsistenteIA;
