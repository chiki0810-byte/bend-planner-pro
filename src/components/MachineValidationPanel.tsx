import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Factory, ShieldCheck, AlertTriangle, ShieldX, ListOrdered,
  RefreshCw, Eye, Cpu, Ruler, Gauge, Zap,
} from "lucide-react";
import { BendResult } from "@/pages/Index";
import { BendItemValue } from "./BendItem";
import { MACHINES, MachineId, validateOnMachine, MachineValidation } from "@/lib/machineValidation";

interface Props {
  result: BendResult | null;
  bends: BendItemValue[];
  material: string;
  thickness: number;
}

const STORAGE_KEY = "machine-validation-prefs";

interface StoredPrefs {
  machineId: MachineId;
  width: string;
}

const loadPrefs = (): StoredPrefs => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { machineId: "stefa8", width: "" };
};

const MachineValidationPanel = ({ result, bends, material, thickness }: Props) => {
  const initial = loadPrefs();
  const [machineId, setMachineId] = useState<MachineId>(initial.machineId);
  const [width, setWidth] = useState<string>(initial.width);
  const [showSequence, setShowSequence] = useState(false);
  const [recalcKey, setRecalcKey] = useState(0);

  // Persistencia entre sesiones
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ machineId, width }));
    } catch {}
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

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-4">
      {/* Panel principal */}
      <Card className="border-sky-400/20 bg-gradient-to-b from-[hsl(218_40%_10%)] to-[hsl(218_50%_6%)] text-sky-100 shadow-[0_0_40px_hsl(210_100%_40%/0.15)]">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-sky-400/20">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-400/30">
              <Factory className="w-5 h-5 text-sky-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold tracking-tight">Validación por Máquina</h2>
              <p className="text-xs text-sky-300/70 uppercase tracking-widest">Motor de plegabilidad real</p>
            </div>
            <StatusPill validation={validation} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-sky-300/80 flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Máquina
              </Label>
              <Select value={machineId} onValueChange={(v) => setMachineId(v as MachineId)}>
                <SelectTrigger className="bg-sky-500/5 border-sky-400/30 text-sky-100 h-11">
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
                className="bg-sky-500/5 border-sky-400/30 text-sky-100 placeholder:text-sky-300/40 h-11"
              />
            </div>
          </div>

          <MachineSpecGrid machineId={machineId} />

          {!result && (
            <div className="text-center py-10 px-4 rounded-lg border border-dashed border-sky-400/20 bg-sky-500/5">
              <Factory className="w-10 h-10 text-sky-400/40 mx-auto mb-2" />
              <p className="text-sm text-sky-300/70">
                Calcula primero una pieza en la <span className="text-sky-200 font-semibold">Calculadora</span> para validar la máquina.
              </p>
            </div>
          )}

          {validation && (
            <>
              <StatusBanner validation={validation} machineShort={machine.short} />

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setRecalcKey(k => k + 1)}
                  className="flex-1 min-w-[140px] h-11 bg-gradient-to-b from-sky-400 to-blue-700 hover:from-sky-300 hover:to-blue-600 text-white font-semibold uppercase tracking-wider text-xs border border-sky-300/40 shadow-[0_0_20px_hsl(210_100%_50%/0.4)]"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Recalcular
                </Button>
                <Button
                  onClick={() => setShowSequence(s => !s)}
                  variant="outline"
                  disabled={validation.status === "blocked"}
                  className="flex-1 min-w-[140px] h-11 bg-sky-500/5 border-sky-400/40 text-sky-100 hover:bg-sky-500/15 hover:text-white font-semibold uppercase tracking-wider text-xs"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showSequence ? "Ocultar" : "Ver"} secuencia
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Panel lateral: diagnóstico + secuencia */}
      <Card className="border-sky-400/20 bg-gradient-to-b from-[hsl(218_40%_10%)] to-[hsl(218_50%_6%)] text-sky-100 shadow-[0_0_40px_hsl(210_100%_40%/0.15)]">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-sky-400/20">
            <Gauge className="w-4 h-4 text-sky-300" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-sky-200">Diagnóstico</h3>
          </div>

          {!validation && (
            <p className="text-xs text-sky-300/60 italic text-center py-6">Sin datos de validación.</p>
          )}

          {validation && <IssueList validation={validation} />}

          {validation && showSequence && validation.status !== "blocked" && (
            <>
              <div className="flex items-center gap-2 pt-3 border-t border-sky-400/20">
                <ListOrdered className="w-4 h-4 text-sky-300" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-sky-200">Secuencia</h3>
              </div>
              <SequenceList validation={validation} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatusPill = ({ validation }: { validation: MachineValidation | null }) => {
  if (!validation) {
    return (
      <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border border-sky-400/30 bg-sky-500/10 text-sky-300">
        En espera
      </span>
    );
  }
  const map = {
    ok: { label: "Plegable", cls: "border-emerald-400/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_hsl(150_80%_50%/0.4)]" },
    warning: { label: "Advertencia", cls: "border-yellow-400/50 bg-yellow-500/15 text-yellow-300 shadow-[0_0_12px_hsl(45_100%_50%/0.4)]" },
    blocked: { label: "Bloqueado", cls: "border-red-500/50 bg-red-500/15 text-red-300 shadow-[0_0_12px_hsl(0_80%_55%/0.4)]" },
  } as const;
  const s = map[validation.status];
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-widest border font-bold ${s.cls}`}>
      ● {s.label}
    </span>
  );
};

const MachineSpecGrid = ({ machineId }: { machineId: MachineId }) => {
  const m = MACHINES.find(x => x.id === machineId)!;
  const items = [
    { label: "Largo máx.", value: `${m.maxLength} mm` },
    { label: "Ala máx.", value: `${m.maxFlangeHeight} mm` },
    { label: "Áng. máx.", value: `${m.maxAngle}°` },
    ...(m.maxBackgauge ? [{ label: "Tope", value: `${m.maxBackgauge} mm` }] : []),
    ...(m.tonnage ? [{ label: "Tonelaje", value: `${m.tonnage} t` }] : []),
    { label: "Sentido", value: m.allowDown ? "↑ ↓" : "Solo ↑" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(it => (
        <div key={it.label} className="px-2 py-2 rounded-md border border-sky-400/20 bg-sky-500/5 text-center">
          <div className="text-[9px] uppercase tracking-wider text-sky-300/60">{it.label}</div>
          <div className="text-xs font-bold text-sky-100 mt-0.5">{it.value}</div>
        </div>
      ))}
    </div>
  );
};

const StatusBanner = ({ validation, machineShort }: { validation: MachineValidation; machineShort: string }) => {
  if (validation.status === "ok") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg border border-emerald-400/40 bg-emerald-500/10">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-emerald-300 uppercase text-xs tracking-widest">Plegable</div>
          <div className="text-xs text-emerald-200/80 mt-1">La pieza cumple todas las reglas de {machineShort}.</div>
        </div>
      </div>
    );
  }
  if (validation.status === "warning") {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-400/40 bg-yellow-500/10">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-yellow-300 uppercase text-xs tracking-widest">Plegable con advertencias</div>
          <div className="text-xs text-yellow-200/80 mt-1">Revisa el diagnóstico antes de plegar.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-red-500/50 bg-red-500/10">
      <ShieldX className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      <div>
        <div className="font-bold text-red-300 uppercase text-xs tracking-widest">No plegable en {machineShort}</div>
        <div className="text-xs text-red-200/80 mt-1">Restricciones físicas impiden el plegado.</div>
      </div>
    </div>
  );
};

const IssueList = ({ validation }: { validation: MachineValidation }) => {
  if (validation.issues.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-md border border-emerald-400/30 bg-emerald-500/5">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span className="text-xs text-emerald-200">Sin incidencias detectadas.</span>
      </div>
    );
  }
  // Prioridad: error > warn > info
  const order = { error: 0, warn: 1, info: 2 } as const;
  const sorted = [...validation.issues].sort((a, b) => order[a.level] - order[b.level]);

  const styles = {
    error: { bar: "bg-red-500", chip: "bg-red-500/20 text-red-300 border-red-500/40", icon: <ShieldX className="w-3.5 h-3.5" /> },
    warn: { bar: "bg-yellow-400", chip: "bg-yellow-500/20 text-yellow-300 border-yellow-400/40", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    info: { bar: "bg-sky-400", chip: "bg-sky-500/20 text-sky-300 border-sky-400/40", icon: <Zap className="w-3.5 h-3.5" /> },
  } as const;

  return (
    <ul className="space-y-2">
      {sorted.map((it, idx) => {
        const s = styles[it.level];
        return (
          <li key={idx} className="relative flex items-start gap-2 p-2.5 pl-3 rounded-md border border-sky-400/15 bg-sky-500/5 overflow-hidden">
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${s.bar}`} />
            <Badge className={`${s.chip} border h-5 px-1.5 gap-1 flex-shrink-0`}>
              {s.icon}
              <span className="text-[9px] tracking-wider">{it.code}</span>
            </Badge>
            <span className="text-xs text-sky-100/90 leading-snug flex-1">{it.message}</span>
          </li>
        );
      })}
    </ul>
  );
};

const SequenceList = ({ validation }: { validation: MachineValidation }) => {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-sky-300/60">
        {validation.machine.recommendedSequence === "outside-in"
          ? "Exteriores → Interiores"
          : "Interiores → Exteriores"}
      </p>
      <ol className="space-y-1.5">
        {validation.sequence.map(s => (
          <li key={s.order} className="flex items-center gap-2 p-2 rounded-md border border-sky-400/15 bg-sky-500/5">
            <span className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-b from-sky-400 to-blue-700 text-white shadow-[0_0_8px_hsl(210_100%_50%/0.5)] flex-shrink-0">
              {s.order}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-sky-100">
                Pliegue #{s.bendOrder} · {s.angle}° {s.direction === 1 ? "↑" : "↓"}
              </div>
              <div className="text-[10px] text-sky-300/70 truncate">
                dist. {s.distance} mm{s.note ? ` · ${s.note}` : ""}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default MachineValidationPanel;
