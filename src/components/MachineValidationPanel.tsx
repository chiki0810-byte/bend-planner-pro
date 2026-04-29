import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Factory, ShieldCheck, AlertTriangle, ShieldX, ListOrdered,
  RefreshCw, Cpu, Ruler, Ruler as RulerIcon, Layers, Triangle, ArrowUpDown,
  MoveVertical, Anchor, GitBranch, Zap, Box, Gauge, Download, ArrowLeft,
  CheckCircle2, XCircle, MinusCircle,
} from "lucide-react";
import { BendResult } from "@/pages/Index";
import { BendItemValue } from "./BendItem";
import { MACHINES, MachineId, validateOnMachine, MachineValidation, ValidationIssue } from "@/lib/machineValidation";

interface Props {
  result: BendResult | null;
  bends: BendItemValue[];
  material: string;
  thickness: number;
}

const STORAGE_KEY = "machine-validation-prefs";

interface StoredPrefs { machineId: MachineId; width: string; }

const loadPrefs = (): StoredPrefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { machineId: "stefa8", width: "" };
};

// ── Reglas mostradas en el panel de diagnóstico ────────────────────────────
type RuleStatus = "ok" | "warn" | "error" | "na";
interface RuleRow {
  key: string;
  label: string;
  icon: typeof Factory;
  status: RuleStatus;
  detail: string;
}

const RULE_DEFS: { key: string; label: string; icon: typeof Factory; codes: string[] }[] = [
  { key: "length",     label: "Largo",            icon: RulerIcon,   codes: ["LENGTH"] },
  { key: "thickness",  label: "Espesor",          icon: Layers,      codes: ["THICKNESS", "MATERIAL"] },
  { key: "angle",      label: "Ángulo",           icon: Triangle,    codes: ["ANGLE"] },
  { key: "direction",  label: "Sentido",          icon: ArrowUpDown, codes: ["DIRECTION"] },
  { key: "flange",     label: "Altura de ala",    icon: MoveVertical,codes: ["FLANGE"] },
  { key: "backgauge",  label: "Tope",             icon: Anchor,      codes: ["BACKGAUGE"] },
  { key: "gooseneck",  label: "Cuello de cisne",  icon: GitBranch,   codes: ["GOOSENECK"] },
  { key: "collision",  label: "Choques",          icon: Zap,         codes: ["COLLISION", "TRAY_COLLISION"] },
  { key: "closed",     label: "Geometría cerrada",icon: Box,         codes: ["CLOSED_GEOMETRY", "DEEP_BOX"] },
  { key: "tonnage",    label: "Tonelaje",         icon: Gauge,       codes: ["TONNAGE", "TONNAGE_HIGH", "TONNAGE_OK"] },
];

function buildRules(validation: MachineValidation): RuleRow[] {
  const m = validation.machine;
  return RULE_DEFS.map((def) => {
    const matched = validation.issues.filter(i => def.codes.includes(i.code));
    // Reglas no aplicables a esta máquina
    if (def.key === "backgauge" && !m.maxBackgauge) {
      return { key: def.key, label: def.label, icon: def.icon, status: "na", detail: "No aplica" };
    }
    if (def.key === "gooseneck" && !m.goosenecK) {
      return { key: def.key, label: def.label, icon: def.icon, status: "na", detail: "No aplica" };
    }
    if (def.key === "tonnage" && !m.tonnage) {
      return { key: def.key, label: def.label, icon: def.icon, status: "na", detail: "No aplica" };
    }
    if (matched.length === 0) {
      return { key: def.key, label: def.label, icon: def.icon, status: "ok", detail: "Dentro de límites" };
    }
    const worst: RuleStatus = matched.some(i => i.level === "error") ? "error"
      : matched.some(i => i.level === "warn") ? "warn" : "ok";
    return {
      key: def.key, label: def.label, icon: def.icon, status: worst,
      detail: matched[0].message,
    };
  });
}

const MachineValidationPanel = ({ result, bends, material, thickness }: Props) => {
  const navigate = useNavigate();
  const initial = loadPrefs();
  const [machineId, setMachineId] = useState<MachineId>(initial.machineId);
  const [width, setWidth] = useState<string>(initial.width);
  const [recalcKey, setRecalcKey] = useState(0);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ machineId, width })); } catch {}
  }, [machineId, width]);

  const validation = useMemo(() => {
    if (!result) return null;
    return validateOnMachine({
      machineId, result, bends, material, thickness,
      pieceWidth: parseFloat(width) || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machineId, result, bends, material, thickness, width, recalcKey]);

  const machine = MACHINES.find(m => m.id === machineId)!;
  const rules = validation ? buildRules(validation) : [];

  const handleExport = () => {
    if (!validation || validation.status === "blocked") return;
    const lines = [
      `SECUENCIA DE PLEGADO RECOMENDADA`,
      `Máquina: ${validation.machine.name}`,
      `Material: ${material}  ·  Espesor: ${thickness} mm`,
      `Largo pieza: ${result?.pieceLength} mm  ·  Ancho: ${width || result?.pieceLength} mm`,
      `Estrategia: ${validation.machine.recommendedSequence === "outside-in" ? "Exteriores → Interiores" : "Interiores → Exteriores"}`,
      ``,
      `Paso  Pliegue  Ángulo  Sentido  Distancia`,
      `────────────────────────────────────────────`,
      ...validation.sequence.map(s =>
        `${String(s.order).padStart(3)}   #${String(s.bendOrder).padStart(2)}     ${String(s.angle).padStart(4)}°   ${s.direction === 1 ? "↑ Arriba" : "↓ Abajo "}  ${s.distance} mm${s.note ? `  · ${s.note}` : ""}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `secuencia-${validation.machine.short.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Secuencia exportada", description: "Archivo .txt descargado." });
  };

  return (
    <div className="space-y-5">
      {/* 1. SELECTOR DE MÁQUINA ARRIBA */}
      <Card className="border-sky-400/20 bg-gradient-to-b from-[hsl(218_40%_10%)] to-[hsl(218_50%_6%)] text-sky-100 shadow-[0_0_40px_hsl(210_100%_40%/0.15)]">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-sky-400/20">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-400/30">
              <Factory className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Selección de Máquina</h2>
              <p className="text-[10px] uppercase tracking-[0.25em] text-sky-300/70">Motor de plegabilidad real</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-sky-300/80 flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Máquina
              </Label>
              <Select value={machineId} onValueChange={(v) => setMachineId(v as MachineId)}>
                <SelectTrigger className="bg-sky-500/5 border-sky-400/30 text-sky-100 h-12 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MACHINES.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.short}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-sky-300/80 flex items-center gap-1">
                <Ruler className="w-3 h-3" /> Ancho de plegado (mm)
              </Label>
              <Input
                type="number" placeholder="Ej: 1000" value={width}
                onChange={(e) => setWidth(e.target.value)} min="0" step="1"
                className="bg-sky-500/5 border-sky-400/30 text-sky-100 placeholder:text-sky-300/40 h-12"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!result && (
        <Card className="border-dashed border-sky-400/30 bg-sky-500/5">
          <CardContent className="text-center py-12">
            <Factory className="w-12 h-12 text-sky-400/40 mx-auto mb-3" />
            <p className="text-sm text-sky-200/80">
              Calcula primero una pieza en la <span className="font-semibold text-sky-100">Calculadora</span> para validar la máquina.
            </p>
            <Button
              onClick={() => navigate("/calculadora")}
              className="mt-4 bg-gradient-to-b from-sky-400 to-blue-700 hover:from-sky-300 hover:to-blue-600 text-white"
            >
              Ir a Calculadora
            </Button>
          </CardContent>
        </Card>
      )}

      {validation && (
        <>
          {/* 2. SEMÁFORO GRANDE */}
          <SemaphoreCard validation={validation} machineShort={machine.short} />

          {/* 3. PANEL DE DIAGNÓSTICO POR REGLA */}
          <Card className="border-sky-400/20 bg-gradient-to-b from-[hsl(218_40%_10%)] to-[hsl(218_50%_6%)] text-sky-100 shadow-[0_0_40px_hsl(210_100%_40%/0.15)]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-sky-400/20">
                <Gauge className="w-4 h-4 text-sky-300" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-sky-200">Diagnóstico por Regla</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rules.map(r => <RuleCard key={r.key} rule={r} />)}
              </div>
            </CardContent>
          </Card>

          {/* 4. SECUENCIA RECOMENDADA */}
          {validation.status !== "blocked" && (
            <Card className="border-sky-400/20 bg-gradient-to-b from-[hsl(218_40%_10%)] to-[hsl(218_50%_6%)] text-sky-100 shadow-[0_0_40px_hsl(210_100%_40%/0.15)]">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-sky-400/20">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-sky-300" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-sky-200">Secuencia Recomendada</h3>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-sky-300/70">
                    {validation.machine.recommendedSequence === "outside-in" ? "Ext → Int" : "Int → Ext"}
                  </span>
                </div>
                <SequenceList validation={validation} />
              </CardContent>
            </Card>
          )}

          {/* 5. BOTONES DE ACCIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Button
              onClick={() => { setRecalcKey(k => k + 1); toast({ title: "Validación recalculada" }); }}
              className="h-12 bg-gradient-to-b from-sky-400 to-blue-700 hover:from-sky-300 hover:to-blue-600 text-white font-semibold uppercase tracking-wider text-xs border border-sky-300/40 shadow-[0_0_20px_hsl(210_100%_50%/0.4)]"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Recalcular
            </Button>
            <Button
              onClick={handleExport}
              disabled={validation.status === "blocked"}
              variant="outline"
              className="h-12 bg-sky-500/5 border-sky-400/40 text-sky-100 hover:bg-sky-500/15 hover:text-white font-semibold uppercase tracking-wider text-xs"
            >
              <Download className="w-4 h-4 mr-2" /> Exportar secuencia
            </Button>
            <Button
              onClick={() => navigate("/calculadora")}
              variant="outline"
              className="h-12 bg-sky-500/5 border-sky-400/40 text-sky-100 hover:bg-sky-500/15 hover:text-white font-semibold uppercase tracking-wider text-xs"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver a calculadora
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Semáforo grande ───────────────────────────────────────────────────────
const SemaphoreCard = ({ validation, machineShort }: { validation: MachineValidation; machineShort: string }) => {
  const config = {
    ok: {
      label: "PLEGABLE", sub: `Cumple todas las reglas de ${machineShort}`,
      color: "emerald", glow: "hsl(150_80%_50%/0.5)", icon: ShieldCheck,
    },
    warning: {
      label: "ADVERTENCIA", sub: "Plegable, revisa el diagnóstico antes de operar",
      color: "yellow", glow: "hsl(45_100%_50%/0.5)", icon: AlertTriangle,
    },
    blocked: {
      label: "BLOQUEADO", sub: `No plegable en ${machineShort} — restricciones físicas`,
      color: "red", glow: "hsl(0_85%_55%/0.5)", icon: ShieldX,
    },
  } as const;
  const c = config[validation.status];
  const Icon = c.icon;

  const lights: Array<{ tone: "ok" | "warning" | "blocked"; cls: string }> = [
    { tone: "blocked", cls: "bg-red-500" },
    { tone: "warning", cls: "bg-yellow-400" },
    { tone: "ok", cls: "bg-emerald-500" },
  ];

  const colorBorder = c.color === "emerald" ? "border-emerald-400/50"
    : c.color === "yellow" ? "border-yellow-400/50" : "border-red-500/50";
  const colorText = c.color === "emerald" ? "text-emerald-300"
    : c.color === "yellow" ? "text-yellow-300" : "text-red-300";
  const colorBg = c.color === "emerald" ? "bg-emerald-500/10"
    : c.color === "yellow" ? "bg-yellow-500/10" : "bg-red-500/10";

  return (
    <Card className={`border-2 ${colorBorder} ${colorBg} shadow-[0_0_60px_${c.glow}]`}
      style={{ boxShadow: `0 0 50px ${c.glow}` }}>
      <CardContent className="p-6">
        <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap">
          {/* Semáforo vertical */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-black/40 border border-sky-400/20">
            {lights.map((l) => {
              const active = l.tone === validation.status;
              return (
                <div key={l.tone}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    active ? `${l.cls} border-white/40` : "bg-black/60 border-white/10"
                  }`}
                  style={active ? { boxShadow: `0 0 20px ${c.glow}, inset 0 0 8px rgba(255,255,255,0.4)` } : undefined}
                />
              );
            })}
          </div>

          {/* Texto de estado */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Icon className={`w-7 h-7 ${colorText}`} />
              <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${colorText}`}>{c.label}</h2>
            </div>
            <p className={`text-sm mt-1 ${colorText} opacity-80`}>{c.sub}</p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-sky-300/60 mt-2">
              {validation.issues.filter(i => i.level === "error").length} errores ·{" "}
              {validation.issues.filter(i => i.level === "warn").length} advertencias
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Tarjeta por regla ─────────────────────────────────────────────────────
const RuleCard = ({ rule }: { rule: RuleRow }) => {
  const Icon = rule.icon;
  const map = {
    ok: {
      border: "border-emerald-400/40", bg: "bg-emerald-500/5",
      iconBg: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
      status: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      label: "OK", labelCls: "text-emerald-300",
    },
    warn: {
      border: "border-yellow-400/40", bg: "bg-yellow-500/5",
      iconBg: "bg-yellow-500/15 text-yellow-300 border-yellow-400/40",
      status: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
      label: "AVISO", labelCls: "text-yellow-300",
    },
    error: {
      border: "border-red-500/50", bg: "bg-red-500/5",
      iconBg: "bg-red-500/15 text-red-300 border-red-500/40",
      status: <XCircle className="w-4 h-4 text-red-400" />,
      label: "ERROR", labelCls: "text-red-300",
    },
    na: {
      border: "border-sky-400/15", bg: "bg-sky-500/5 opacity-60",
      iconBg: "bg-sky-500/10 text-sky-400/60 border-sky-400/20",
      status: <MinusCircle className="w-4 h-4 text-sky-400/50" />,
      label: "N/A", labelCls: "text-sky-400/60",
    },
  } as const;
  const s = map[rule.status];

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${s.border} ${s.bg}`}>
      <div className={`p-2 rounded-md border ${s.iconBg} flex-shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-100">{rule.label}</span>
          <span className={`text-[9px] font-bold tracking-widest ${s.labelCls}`}>{s.label}</span>
        </div>
        <p className="text-[11px] text-sky-200/70 truncate" title={rule.detail}>{rule.detail}</p>
      </div>
      <div className="flex-shrink-0">{s.status}</div>
    </div>
  );
};

// ─── Lista de secuencia ────────────────────────────────────────────────────
const SequenceList = ({ validation }: { validation: MachineValidation }) => (
  <ol className="space-y-2">
    {validation.sequence.map(s => (
      <li key={s.order} className="flex items-center gap-3 p-3 rounded-lg border border-sky-400/15 bg-sky-500/5">
        <span className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-black bg-gradient-to-b from-sky-400 to-blue-700 text-white shadow-[0_0_12px_hsl(210_100%_50%/0.5)] flex-shrink-0">
          {s.order}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-sky-100">
            Pliegue #{s.bendOrder} · {s.angle}° {s.direction === 1 ? "↑ Arriba" : "↓ Abajo"}
          </div>
          <div className="text-[11px] text-sky-300/70">
            Distancia {s.distance} mm{s.note ? ` · ${s.note}` : ""}
          </div>
        </div>
      </li>
    ))}
  </ol>
);

export default MachineValidationPanel;
