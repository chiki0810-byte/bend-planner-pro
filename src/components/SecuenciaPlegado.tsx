import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ListOrdered, ArrowRight } from "lucide-react";
import {
  generarSecuenciaPlegado,
  type CategoriaPliegue,
  type PliegueSec,
} from "@/lib/secuenciaPlegado";

interface PliegueRow extends PliegueSec {
  id: string;
}

const newRow = (): PliegueRow => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  longitud_mm: 0,
  angulo_deg: 90,
  cierra_pieza: false,
});

const CATEGORIA_LABEL: Record<CategoriaPliegue, string> = {
  normal: "Normal",
  delicado: "Delicado (<20 mm)",
  critico: "Crítico (>120°)",
  cierre: "Cierra pieza",
};

const CATEGORIA_STYLE: Record<CategoriaPliegue, string> = {
  normal: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  delicado: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  critico: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  cierre: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
};

const SecuenciaPlegado = () => {
  const [rows, setRows] = useState<PliegueRow[]>([
    { ...newRow(), longitud_mm: 50, angulo_deg: 90 },
    { ...newRow(), longitud_mm: 15, angulo_deg: 90 },
    { ...newRow(), longitud_mm: 60, angulo_deg: 135 },
    { ...newRow(), longitud_mm: 40, angulo_deg: 90, cierra_pieza: true },
  ]);

  const update = <K extends keyof PliegueRow>(id: string, k: K, v: PliegueRow[K]) =>
    setRows((p) => p.map((r) => (r.id === id ? { ...r, [k]: v } : r)));

  const add = () => setRows((p) => [...p, newRow()]);
  const remove = (id: string) =>
    setRows((p) => (p.length > 1 ? p.filter((r) => r.id !== id) : p));

  const secuencia = useMemo(
    () =>
      generarSecuenciaPlegado(
        rows.map((r) => ({
          longitud_mm: Number(r.longitud_mm) || 0,
          angulo_deg: Number(r.angulo_deg) || 0,
          cierra_pieza: r.cierra_pieza,
        })),
      ).map((s, i) => ({ ...s, paso: i + 1, originalRow: rows[s.ordenOriginal] })),
    [rows],
  );

  return (
    <div className="space-y-5 p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListOrdered className="w-5 h-5 text-sky-300" />
            Pliegues de la pieza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.map((r, i) => (
            <div
              key={r.id}
              className="grid grid-cols-[28px_1fr_1fr_auto_36px] gap-2 items-end p-2 rounded-md border border-border bg-muted/20"
            >
              <span className="text-xs text-muted-foreground pb-2">#{i + 1}</span>
              <div>
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Longitud (mm)
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={r.longitud_mm}
                  onChange={(e) => update(r.id, "longitud_mm", Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Ángulo (°)
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={r.angulo_deg}
                  onChange={(e) => update(r.id, "angulo_deg", Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col items-center gap-1 px-2">
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Cierra
                </Label>
                <Switch
                  checked={r.cierra_pieza}
                  onCheckedChange={(v) => update(r.id, "cierra_pieza", v)}
                />
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove(r.id)}
                disabled={rows.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button onClick={add} variant="outline" size="sm" className="w-full">
            <Plus className="w-4 h-4 mr-1" /> Añadir pliegue
          </Button>
        </CardContent>
      </Card>

      <Card className="border-sky-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowRight className="w-5 h-5 text-sky-300" />
            Secuencia de plegado recomendada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="space-y-2">
            {secuencia.map((s) => (
              <li
                key={s.ordenOriginal}
                className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/30"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-sky-500/20 text-sky-200 font-bold tabular-nums">
                  {s.paso}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">
                    Pliegue original #{s.ordenOriginal + 1} ·{" "}
                    <span className="text-muted-foreground font-normal">
                      {s.pliegue.longitud_mm} mm @ {s.pliegue.angulo_deg}°
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={CATEGORIA_STYLE[s.categoria]}>
                  {CATEGORIA_LABEL[s.categoria]}
                </Badge>
              </li>
            ))}
          </ol>

          <div className="pt-3 border-t border-border space-y-1 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Reglas aplicadas:</p>
            <p>1. Pliegues normales (80–100° y ≥20 mm) primero.</p>
            <p>2. Delicados (&lt;20 mm) después de los normales.</p>
            <p>3. Críticos (&gt;120°) después de los delicados.</p>
            <p>4. Pliegues que cierran la pieza siempre al final.</p>
            <p>5. Dentro de la misma categoría se respeta el orden original.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecuenciaPlegado;
