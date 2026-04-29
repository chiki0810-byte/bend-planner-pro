import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Camera, Plus, Trash2, Calculator, Factory, ListOrdered, Save,
  ImageIcon, Ruler, Layers, FileText, ChevronUp, ChevronDown,
} from "lucide-react";
import { savePiece } from "@/lib/storage";

// ─── Tipos / estados ──────────────────────────────────────────────────────
type Sentido = "interior" | "exterior";
type MaterialKey =
  | "acero"
  | "inox"
  | "aluminio"
  | "galvanizado"
  | "corten"
  | "duro500"
  | "duro600"
  | "laton"
  | "cobre";

const MATERIALS: { key: MaterialKey; label: string; k: number }[] = [
  { key: "acero", label: "Acero", k: 0.33 },
  { key: "inox", label: "Inox", k: 0.40 },
  { key: "aluminio", label: "Aluminio", k: 0.50 },
  { key: "galvanizado", label: "Galvanizado", k: 0.33 },
  { key: "corten", label: "Corten", k: 0.33 },
  { key: "duro500", label: "Duro 500", k: 0.33 },
  { key: "duro600", label: "Duro 600", k: 0.33 },
  { key: "laton", label: "Latón", k: 0.45 },
  { key: "cobre", label: "Cobre", k: 0.45 },
];

const getK = (m: MaterialKey) => MATERIALS.find(x => x.key === m)?.k ?? 0.33;

interface Pliegue {
  id: string;
  longitud: number;
  angulo: number;
  radio: number;
  sentido: Sentido;
}

interface ValidacionState {
  estado: "verde" | "rojo";
  maquina: string;
}

interface PasoSecuencia {
  paso: number;
  angulo: number;
  maquina: string;
}

const newPliegue = (): Pliegue => ({
  id: crypto.randomUUID(),
  longitud: 0,
  angulo: 90,
  radio: 1,
  sentido: "interior",
});

// ─── Página ───────────────────────────────────────────────────────────────
const FichaPiezaRapidaPage = () => {
  // Campos básicos
  const [fotoPlano, setFotoPlano] = useState<string | null>(null);
  const [nombrePieza, setNombrePieza] = useState("");
  const [espesor, setEspesor] = useState<number>(1.0);
  const [material, setMaterial] = useState<MaterialKey>("acero");

  // Repeater de pliegues
  const [pliegues, setPliegues] = useState<Pliegue[]>([newPliegue()]);

  // Estados de cálculo
  const [desarrolloMm, setDesarrolloMm] = useState<number>(0);
  const [validacion, setValidacion] = useState<ValidacionState | null>(null);
  const [secuencia, setSecuencia] = useState<PasoSecuencia[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Acciones ───────────────────────────────────────────────────────────
  const onPickImage = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFotoPlano(reader.result as string);
    reader.readAsDataURL(file);
  };

  const updatePliegue = (id: string, patch: Partial<Pliegue>) =>
    setPliegues(ps => ps.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const addPliegue = () => setPliegues(ps => [...ps, newPliegue()]);
  const removePliegue = (id: string) =>
    setPliegues(ps => (ps.length > 1 ? ps.filter(p => p.id !== id) : ps));
  const movePliegue = (id: string, dir: -1 | 1) => {
    setPliegues(ps => {
      const i = ps.findIndex(p => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ps.length) return ps;
      const copy = [...ps];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };

  // 🟦 Calcular desarrollo
  const calcularDesarrollo = () => {
    const K = getK(material);
    const total = pliegues.reduce((acc, p) => {
      const comp = p.angulo
        ? (Math.PI / 180) * p.angulo * (p.radio + K * espesor)
        : 0;
      return acc + (p.longitud || 0) + comp;
    }, 0);
    setDesarrolloMm(Number(total.toFixed(2)));
    toast({ title: "Desarrollo calculado", description: `${total.toFixed(2)} mm (K=${K})` });
  };

  // 🟩 Validar por máquina
  const validarPorMaquina = () => {
    if (desarrolloMm <= 0) {
      toast({ title: "Calcula primero el desarrollo", variant: "destructive" });
      return;
    }
    const maquinas = [
      { nombre: "STEFA 8M", max: 8000, tope: 1000 },
      { nombre: "JORDI 180T", max: 6100, tope: 1000 },
      { nombre: "PRENSA 6M", max: 6000, tope: 950 },
    ];
    const viable = maquinas.find(m => desarrolloMm <= m.max);
    const v: ValidacionState = viable
      ? { estado: "verde", maquina: viable.nombre }
      : { estado: "rojo", maquina: "Ninguna" };
    setValidacion(v);
    toast({
      title: v.estado === "verde" ? "✅ Plegable" : "⛔ No plegable",
      description: v.estado === "verde" ? `Máquina viable: ${v.maquina}` : "Ninguna máquina admite el desarrollo.",
      variant: v.estado === "verde" ? "default" : "destructive",
    });
  };

  // 🟧 Generar secuencia
  const generarSecuencia = () => {
    if (!validacion) {
      toast({ title: "Valida primero por máquina", variant: "destructive" });
      return;
    }
    const seq = [...pliegues]
      .sort((a, b) => b.longitud - a.longitud)
      .map((p, i) => ({
        paso: i + 1,
        angulo: p.angulo,
        maquina: validacion.maquina,
      }));
    setSecuencia(seq);
    toast({ title: "Secuencia generada", description: `${seq.length} pasos` });
  };

  // 🟦 Guardar
  const guardar = async () => {
    if (!nombrePieza.trim()) {
      toast({ title: "Falta nombre", description: "Indica un nombre para la pieza.", variant: "destructive" });
      return;
    }
    try {
      await savePiece({
        name: nombrePieza,
        material,
        thickness: espesor,
        pieceLength: desarrolloMm,
        payload: JSON.stringify({
          source: "ficha-rapida",
          imagen: fotoPlano,
          pliegues,
          desarrollo_mm: desarrolloMm,
          validacion,
          secuencia,
          fecha: Date.now(),
        }),
      });
      toast({ title: "Pieza guardada", description: nombrePieza });
    } catch (e) {
      toast({ title: "Error al guardar", description: String(e), variant: "destructive" });
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────
  const inputCls =
    "bg-sky-500/5 border-sky-400/30 text-sky-100 placeholder:text-sky-300/40 h-11";

  const semaforo = useMemo(() => {
    if (!validacion) return null;
    const ok = validacion.estado === "verde";
    return (
      <div
        className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
          ok
            ? "border-emerald-400/50 bg-emerald-500/10"
            : "border-red-500/50 bg-red-500/10"
        }`}
        style={{
          boxShadow: ok
            ? "0 0 30px hsl(150 80% 50% / 0.3)"
            : "0 0 30px hsl(0 85% 55% / 0.3)",
        }}
      >
        <div
          className={`w-6 h-6 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`}
          style={{
            boxShadow: ok
              ? "0 0 16px hsl(150 80% 50% / 0.8)"
              : "0 0 16px hsl(0 85% 55% / 0.8)",
          }}
        />
        <div>
          <div className={`text-sm font-black uppercase tracking-widest ${ok ? "text-emerald-300" : "text-red-300"}`}>
            {ok ? "Plegable" : "No plegable"}
          </div>
          <div className="text-xs text-sky-200/80">Máquina: {validacion.maquina}</div>
        </div>
      </div>
    );
  }, [validacion]);

  return (
    <div className="min-h-full bg-gradient-to-b from-[hsl(218_45%_8%)] via-[hsl(218_40%_10%)] to-background">
      {/* Header */}
      <div
        className="border-b border-sky-400/20 bg-[hsl(218_50%_6%)]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(210_100%_70%/0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(210_100%_70%/0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="container mx-auto px-4 py-6 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-400/30 shadow-[0_0_20px_hsl(210_100%_50%/0.3)]">
            <FileText className="w-6 h-6 text-sky-300" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-sky-50">Ficha Pieza Rápida</h1>
            <p className="text-[11px] uppercase tracking-[0.25em] text-sky-300/70 mt-0.5">
              Captura · Cálculo · Validación · Secuencia
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-5">
        {/* DATOS BÁSICOS + FOTO */}
        <Card className="border-sky-400/20 bg-gradient-to-b from-[hsl(218_40%_10%)] to-[hsl(218_50%_6%)] text-sky-100">
          <CardContent className="p-5 grid md:grid-cols-[200px_1fr] gap-5">
            {/* ImagePicker */}
            <div>
              <Label className="text-xs uppercase tracking-wider text-sky-300/80">Foto plano</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="mt-1.5 aspect-square rounded-lg border-2 border-dashed border-sky-400/30 bg-sky-500/5 hover:bg-sky-500/10 cursor-pointer overflow-hidden flex items-center justify-center"
              >
                {fotoPlano ? (
                  <img src={fotoPlano} alt="Plano de la pieza" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-sky-300/60 p-3">
                    <Camera className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-[11px] uppercase tracking-wider">Tocar para añadir</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              />
              {fotoPlano && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFotoPlano(null)}
                  className="w-full mt-2 bg-sky-500/5 border-sky-400/30 text-sky-200 hover:bg-sky-500/15"
                >
                  Quitar foto
                </Button>
              )}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-sky-300/80">Nombre de la pieza</Label>
                <Input
                  value={nombrePieza}
                  onChange={(e) => setNombrePieza(e.target.value)}
                  placeholder="Ej: Bandeja lateral"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-sky-300/80 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Espesor (mm)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={espesor}
                  onChange={(e) => setEspesor(parseFloat(e.target.value) || 0)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-sky-300/80">Material</Label>
                <Select value={material} onValueChange={(v) => setMaterial(v as MaterialKey)}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acero">Acero (K=0.33)</SelectItem>
                    <SelectItem value="inox">Inox (K=0.40)</SelectItem>
                    <SelectItem value="aluminio">Aluminio (K=0.50)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* REPEATER PLIEGUES */}
        <Card className="border-sky-400/20 bg-gradient-to-b from-[hsl(218_40%_10%)] to-[hsl(218_50%_6%)] text-sky-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-sky-400/20">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-sky-300" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-sky-200">
                  Pliegues ({pliegues.length})
                </h3>
              </div>
              <Button
                size="sm"
                onClick={addPliegue}
                className="bg-gradient-to-b from-sky-400 to-blue-700 hover:from-sky-300 hover:to-blue-600 text-white"
              >
                <Plus className="w-4 h-4 mr-1" /> Añadir
              </Button>
            </div>

            <div className="space-y-3">
              {pliegues.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3 rounded-lg border border-sky-400/20 bg-sky-500/5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-sky-300">
                      Pliegue #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => movePliegue(p.id, -1)} className="h-7 w-7 text-sky-300 hover:bg-sky-500/15">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => movePliegue(p.id, 1)} className="h-7 w-7 text-sky-300 hover:bg-sky-500/15">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => removePliegue(p.id)} className="h-7 w-7 text-red-400 hover:bg-red-500/15 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-sky-300/70">Longitud (mm)</Label>
                      <Input
                        type="number" step="1" min="0" value={p.longitud}
                        onChange={(e) => updatePliegue(p.id, { longitud: parseFloat(e.target.value) || 0 })}
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-sky-300/70">Ángulo (°)</Label>
                      <Input
                        type="number" step="1" min="0" max="180" value={p.angulo}
                        onChange={(e) => updatePliegue(p.id, { angulo: parseFloat(e.target.value) || 0 })}
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-sky-300/70">Radio (mm)</Label>
                      <Input
                        type="number" step="0.1" min="0" value={p.radio}
                        onChange={(e) => updatePliegue(p.id, { radio: parseFloat(e.target.value) || 0 })}
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-sky-300/70">Sentido</Label>
                      <Select value={p.sentido} onValueChange={(v) => updatePliegue(p.id, { sentido: v as Sentido })}>
                        <SelectTrigger className={inputCls}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interior">Interior</SelectItem>
                          <SelectItem value="exterior">Exterior</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* RESULTADOS */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-sky-400/20 bg-gradient-to-b from-[hsl(218_40%_10%)] to-[hsl(218_50%_6%)] text-sky-100">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-sky-300" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-sky-200">Desarrollo</h3>
              </div>
              <div className="text-4xl font-black text-sky-100 tracking-tight">
                {desarrolloMm.toFixed(2)} <span className="text-base font-bold text-sky-300/70">mm</span>
              </div>
              {semaforo}
            </CardContent>
          </Card>

          <Card className="border-sky-400/20 bg-gradient-to-b from-[hsl(218_40%_10%)] to-[hsl(218_50%_6%)] text-sky-100">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-sky-300" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-sky-200">Secuencia</h3>
              </div>
              {secuencia.length === 0 ? (
                <p className="text-xs text-sky-300/60 italic py-4 text-center">Sin secuencia generada.</p>
              ) : (
                <ol className="space-y-1.5 max-h-56 overflow-auto pr-1">
                  {secuencia.map(s => (
                    <li key={s.paso} className="flex items-center gap-2 p-2 rounded-md border border-sky-400/15 bg-sky-500/5">
                      <span className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-black bg-gradient-to-b from-sky-400 to-blue-700 text-white shadow-[0_0_8px_hsl(210_100%_50%/0.5)]">
                        {s.paso}
                      </span>
                      <div className="text-xs text-sky-100">
                        <span className="font-semibold">{s.angulo}°</span>
                        <span className="text-sky-300/70"> · {s.maquina}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* BOTONES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <Button onClick={calcularDesarrollo} className="h-12 bg-gradient-to-b from-sky-400 to-blue-700 hover:from-sky-300 hover:to-blue-600 text-white font-semibold uppercase tracking-wider text-xs shadow-[0_0_20px_hsl(210_100%_50%/0.4)]">
            <Calculator className="w-4 h-4 mr-1" /> Calcular desarrollo
          </Button>
          <Button onClick={validarPorMaquina} variant="outline" className="h-12 bg-sky-500/5 border-sky-400/40 text-sky-100 hover:bg-sky-500/15 hover:text-white font-semibold uppercase tracking-wider text-xs">
            <Factory className="w-4 h-4 mr-1" /> Validar máquina
          </Button>
          <Button onClick={generarSecuencia} variant="outline" className="h-12 bg-sky-500/5 border-sky-400/40 text-sky-100 hover:bg-sky-500/15 hover:text-white font-semibold uppercase tracking-wider text-xs">
            <ListOrdered className="w-4 h-4 mr-1" /> Generar secuencia
          </Button>
          <Button onClick={guardar} className="h-12 bg-gradient-to-b from-emerald-400 to-emerald-700 hover:from-emerald-300 hover:to-emerald-600 text-white font-semibold uppercase tracking-wider text-xs shadow-[0_0_20px_hsl(150_80%_50%/0.4)]">
            <Save className="w-4 h-4 mr-1" /> Guardar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FichaPiezaRapidaPage;
