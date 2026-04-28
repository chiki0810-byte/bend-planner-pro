import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Factory, ShieldCheck, AlertTriangle, ShieldX, ListOrdered } from "lucide-react";
import { BendResult } from "@/pages/Index";
import { BendItemValue } from "./BendItem";
import { MACHINES, MachineId, validateOnMachine } from "@/lib/machineValidation";

interface Props {
  result: BendResult | null;
  bends: BendItemValue[];
  material: string;
  thickness: number;
}

const MachineValidationPanel = ({ result, bends, material, thickness }: Props) => {
  const [machineId, setMachineId] = useState<MachineId>("stefa8");
  const [width, setWidth] = useState<string>("");

  const validation = useMemo(() => {
    if (!result) return null;
    return validateOnMachine({
      machineId, result, bends, material, thickness,
      pieceWidth: parseFloat(width) || undefined,
    });
  }, [machineId, result, bends, material, thickness, width]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="w-5 h-5 text-primary" />
          Validación por Máquina
        </CardTitle>
        <CardDescription>
          Comprueba si la pieza es plegable en cada máquina real del taller
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Máquina</Label>
            <Select value={machineId} onValueChange={(v) => setMachineId(v as MachineId)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MACHINES.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.short}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ancho de plegado (mm)</Label>
            <Input type="number" placeholder="Ej: 1000" value={width}
              onChange={(e) => setWidth(e.target.value)} min="0" step="1" />
          </div>
        </div>

        {!result && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Calcula primero la pieza para validar la máquina.
          </p>
        )}

        {validation && (
          <>
            <MachineSpecBadges machineId={machineId} />
            <StatusBanner validation={validation} />
            <IssueList validation={validation} />
            <Separator />
            <SequenceList validation={validation} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

const MachineSpecBadges = ({ machineId }: { machineId: MachineId }) => {
  const m = MACHINES.find(x => x.id === machineId)!;
  return (
    <div className="flex flex-wrap gap-1">
      <Badge variant="outline">Máx. {m.maxLength} mm</Badge>
      {m.maxBackgauge && <Badge variant="outline">Tope {m.maxBackgauge} mm</Badge>}
      <Badge variant="outline">Ala ≤ {m.maxFlangeHeight} mm</Badge>
      <Badge variant="outline">Áng. ≤ {m.maxAngle}°</Badge>
      {m.tonnage && <Badge variant="outline">{m.tonnage} t</Badge>}
      <Badge variant="outline">{m.allowDown ? "↑↓" : "Solo ↑"}</Badge>
    </div>
  );
};

const StatusBanner = ({ validation }: { validation: ReturnType<typeof validateOnMachine> }) => {
  if (validation.status === "ok") {
    return (
      <Alert className="border-green-500/40 bg-green-500/10">
        <ShieldCheck className="w-4 h-4 text-green-600" />
        <AlertTitle className="text-green-700">Plegable</AlertTitle>
        <AlertDescription>La pieza cumple todas las reglas de {validation.machine.short}.</AlertDescription>
      </Alert>
    );
  }
  if (validation.status === "warning") {
    return (
      <Alert className="border-yellow-500/40 bg-yellow-500/10">
        <AlertTriangle className="w-4 h-4 text-yellow-600" />
        <AlertTitle className="text-yellow-700">Plegable con advertencias</AlertTitle>
        <AlertDescription>Revisa las advertencias antes de plegar.</AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert variant="destructive">
      <ShieldX className="w-4 h-4" />
      <AlertTitle>No plegable en {validation.machine.short}</AlertTitle>
      <AlertDescription>Hay restricciones físicas que impiden el plegado.</AlertDescription>
    </Alert>
  );
};

const IssueList = ({ validation }: { validation: ReturnType<typeof validateOnMachine> }) => {
  if (validation.issues.length === 0) return null;
  const order = { error: 0, warn: 1, info: 2 } as const;
  const sorted = [...validation.issues].sort((a, b) => order[a.level] - order[b.level]);
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Diagnóstico</h4>
      <ul className="space-y-1 text-xs">
        {sorted.map((it, idx) => (
          <li key={idx} className="flex items-start gap-2 p-2 rounded border bg-card">
            <Badge
              variant={it.level === "error" ? "destructive" : "outline"}
              className={
                it.level === "warn" ? "border-yellow-500 text-yellow-700"
                : it.level === "info" ? "border-blue-500 text-blue-700" : ""
              }
            >
              {it.level === "error" ? "✗" : it.level === "warn" ? "!" : "i"} {it.code}
            </Badge>
            <span className="flex-1">{it.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SequenceList = ({ validation }: { validation: ReturnType<typeof validateOnMachine> }) => {
  if (validation.status === "blocked") {
    return (
      <p className="text-xs text-muted-foreground italic">
        No se genera secuencia: la pieza no es plegable en esta máquina.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold flex items-center gap-1">
        <ListOrdered className="w-4 h-4" />
        Secuencia recomendada ({validation.machine.recommendedSequence === "outside-in" ? "exteriores → interiores" : "interiores → exteriores"})
      </h4>
      <ol className="space-y-1 text-xs">
        {validation.sequence.map(s => (
          <li key={s.order} className="flex items-center gap-2 p-2 rounded border bg-card">
            <Badge className="h-6 w-6 rounded-full p-0 flex items-center justify-center">{s.order}</Badge>
            <span className="font-semibold">Pliegue original #{s.bendOrder}</span>
            <span>· {s.angle}° {s.direction === 1 ? "↑" : "↓"}</span>
            <span className="text-muted-foreground">· dist {s.distance} mm</span>
            {s.note && <span className="ml-auto text-muted-foreground italic">{s.note}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default MachineValidationPanel;
