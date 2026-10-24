import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GitBranch, Plus, Trash2, ArrowUp, ArrowDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { DefaultsByThickness } from "@/lib/bendCalc";
import { getMaterialDefaultsWithCalibration } from "@/lib/storage";
import { calcularDesarrolloPunta } from "@/lib/plieguesPorPunta";
import { ANGULO_CRITICO_PLEGADO, ANGULO_MAXIMO_PLEGABLE, esAnguloCritico, esAnguloPlegable } from "@/lib/limitesAnguloPlegado";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Orientacion = "up" | "down";

interface Pliegue {
  longitud: number;
  angulo: number;
  cierra: boolean;
  orientacion: Orientacion;
}

interface PliegueCalc {
  ba: number;
  comp: number;
  desarrollo: number;
  anguloMaquina: number;
}

const pliegueValido = (p: Pliegue): boolean =>
  Number.isFinite(p.longitud) && p.longitud > 0 &&
  esAnguloPlegable(p.angulo);

const materiales = [
  "Acero",
  "Inox",
  "Aluminio",
  "Cobre",
  "Latón",
  "Galvanizado",
];

const calcPliegue = (p: Pliegue, radio: number, k: number, espesor: number): PliegueCalc => {
  const rad = (p.angulo * Math.PI) / 180;
  const ba = rad * (radio + k * espesor);
  const comp = p.longitud + ba;
  return {
    ba,
    comp,
    desarrollo: comp,
    anguloMaquina: 180 - p.angulo,
  };
};

const PlieguesPorPuntaPage = () => {
  const navigate = useNavigate();
  const [material, setMaterial] = useState("Acero");
  const [espesor, setEspesor] = useState(1.0);
  const defaultsKey = `${material}|${espesor}`;
  const [calibracion, setCalibracion] = useState<{
    key: string;
    defaults?: DefaultsByThickness;
    cargada: boolean;
  }>({ key: "", cargada: false });
  useEffect(() => {
    let activa = true;
    setCalibracion({ key: defaultsKey, cargada: false });
    getMaterialDefaultsWithCalibration(material, espesor)
      .then(({ defaults }) => {
        if (activa) setCalibracion({ key: defaultsKey, defaults, cargada: true });
      })
      .catch(() => {
        if (activa) setCalibracion({ key: defaultsKey, cargada: true });
      });
    return () => { activa = false; };
  }, [material, espesor, defaultsKey]);
  const calibracionCargada = calibracion.key === defaultsKey && calibracion.cargada;
  const defaultsAprobados = calibracionCargada ? calibracion.defaults : undefined;
  const [plieguesA, setPlieguesA] = useState<Pliegue[]>([]);
  const [plieguesB, setPlieguesB] = useState<Pliegue[]>([]);

  const addPliegueA = () =>
    setPlieguesA([...plieguesA, { longitud: 0, angulo: 90, cierra: false, orientacion: "up" }]);

  const addPliegueB = () =>
    setPlieguesB([...plieguesB, { longitud: 0, angulo: 90, cierra: false, orientacion: "up" }]);

  const updatePliegueA = (index: number, field: keyof Pliegue, value: number | boolean | Orientacion) => {
    const next = [...plieguesA];
    next[index] = { ...next[index], [field]: value } as Pliegue;
    setPlieguesA(next);
  };

  const updatePliegueB = (index: number, field: keyof Pliegue, value: number | boolean | Orientacion) => {
    const next = [...plieguesB];
    next[index] = { ...next[index], [field]: value } as Pliegue;
    setPlieguesB(next);
  };

  const removePliegueA = (index: number) =>
    setPlieguesA(plieguesA.filter((_, i) => i !== index));
  const removePliegueB = (index: number) =>
    setPlieguesB(plieguesB.filter((_, i) => i !== index));

  const calcsA = useMemo(
    () => defaultsAprobados
      ? plieguesA.map((p) => pliegueValido(p)
        ? calcPliegue(p, defaultsAprobados.innerRadius, defaultsAprobados.kFactor, espesor)
        : undefined)
      : [],
    [plieguesA, defaultsAprobados, espesor]
  );
  const calcsB = useMemo(
    () => defaultsAprobados
      ? plieguesB.map((p) => pliegueValido(p)
        ? calcPliegue(p, defaultsAprobados.innerRadius, defaultsAprobados.kFactor, espesor)
        : undefined)
      : [],
    [plieguesB, defaultsAprobados, espesor]
  );

  const desarrolloPuntaA = useMemo(() => {
    if (!defaultsAprobados || plieguesA.length === 0 || !plieguesA.every(pliegueValido)) return undefined;
    return calcularDesarrolloPunta(
      plieguesA.map((pliegue) => pliegue.longitud),
      calcsA.map((calculo) => calculo?.ba ?? Number.NaN),
    );
  }, [plieguesA, calcsA, defaultsAprobados]);

  const desarrolloPuntaB = useMemo(() => {
    if (!defaultsAprobados || plieguesB.length === 0 || !plieguesB.every(pliegueValido)) return undefined;
    return calcularDesarrolloPunta(
      plieguesB.map((pliegue) => pliegue.longitud),
      calcsB.map((calculo) => calculo?.ba ?? Number.NaN),
    );
  }, [plieguesB, calcsB, defaultsAprobados]);

  const desarrolloTotal = desarrolloPuntaA === undefined || desarrolloPuntaB === undefined
    ? undefined
    : desarrolloPuntaA + desarrolloPuntaB;

  const renderPliegueRow = (
    p: Pliegue,
    i: number,
    c: PliegueCalc | undefined,
    update: (index: number, field: keyof Pliegue, value: number | boolean | Orientacion) => void,
    remove: (index: number) => void
  ) => (
    <div key={i} className="space-y-2 bg-muted/30 p-3 rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Longitud (mm)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={p.longitud}
            onChange={(e) => update(i, "longitud", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ángulo (°)</Label>
          <Input
            type="number"
            step="1"
            min="0"
            max={ANGULO_MAXIMO_PLEGABLE}
            value={p.angulo}
            onChange={(e) => update(i, "angulo", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Orientación</Label>
          <div className="flex gap-1">
            <Toggle
              pressed={p.orientacion === "up"}
              onPressedChange={() => update(i, "orientacion", "up")}
              className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <ArrowUp className="w-4 h-4" />
            </Toggle>
            <Toggle
              pressed={p.orientacion === "down"}
              onPressedChange={() => update(i, "orientacion", "down")}
              className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <ArrowDown className="w-4 h-4" />
            </Toggle>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cierra</Label>
          <Toggle
            pressed={p.cierra}
            onPressedChange={(v) => update(i, "cierra", v)}
            className="w-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {p.cierra ? "Sí" : "No"}
          </Toggle>
        </div>
        <Button variant="destructive" size="sm" onClick={() => remove(i)} className="h-10">
          <Trash2 className="w-4 h-4 mr-1" /> Eliminar
        </Button>
      </div>
      {c ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-border/40">
          <CalcBox label="Ganancia (BA)" value={c.ba} />
          <CalcBox label="Compensación" value={c.comp} />
          <CalcBox label="Desarrollo" value={c.desarrollo} />
          <CalcBox label="Áng. máquina" value={c.anguloMaquina} unit="°" />
        </div>
      ) : (
        <p className="text-sm text-destructive">
          {!calibracionCargada
            ? "Cargando K y radio aprobados…"
            : !defaultsAprobados
              ? "Sin K y radio aprobados; cálculo no disponible."
              : "Completa una longitud positiva y un ángulo entre 0° y 180° para calcular."}
        </p>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center gap-3">
        <GitBranch className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Pliegues por Punta</h1>
          <p className="text-sm text-muted-foreground">
            Definición y cálculo de pliegues por punta A y B
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parámetros Globales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Material</Label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {materiales.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Espesor (mm)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={espesor}
              onChange={(e) => setEspesor(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>K aprobado</Label>
            <Input
              type="number"
              value={defaultsAprobados?.kFactor ?? ""}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label>Radio aprobado (mm)</Label>
            <Input
              type="number"
              value={defaultsAprobados?.innerRadius ?? ""}
              readOnly
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Punta A – Lista de Pliegues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plieguesA.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Sin pliegues definidos para la punta A.
            </p>
          )}
          {plieguesA.map((p, i) =>
            renderPliegueRow(p, i, calcsA[i], updatePliegueA, removePliegueA)
          )}
          <Button onClick={addPliegueA} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Añadir pliegue A
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Punta B – Lista de Pliegues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plieguesB.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Sin pliegues definidos para la punta B.
            </p>
          )}
          {plieguesB.map((p, i) =>
            renderPliegueRow(p, i, calcsB[i], updatePliegueB, removePliegueB)
          )}
          <Button onClick={addPliegueB} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Añadir pliegue B
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="text-base">Resultados</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {desarrolloPuntaA !== undefined && desarrolloPuntaB !== undefined && desarrolloTotal !== undefined ? (
            <>
              <ResultBox label="Desarrollo Punta A" value={desarrolloPuntaA} />
              <ResultBox label="Desarrollo Punta B" value={desarrolloPuntaB} />
              <ResultBox label={`D:${desarrolloTotal.toFixed(0)}`} value={desarrolloTotal} highlight />
            </>
          ) : (
            <Alert className="col-span-full border-destructive/50 text-destructive">
              <AlertDescription>
                {!calibracionCargada
                  ? "Cargando K y radio aprobados para material y espesor…"
                  : !defaultsAprobados
                    ? `No hay K y radio aprobados para ${material || "el material seleccionado"} con espesor ${espesor} mm. No se muestra un desarrollo válido.`
                    : `Completa longitudes válidas y ángulos entre 0° y ${ANGULO_MAXIMO_PLEGABLE}° para todas las puntas.`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {[...plieguesA, ...plieguesB].some((pliegue) => esAnguloCritico(pliegue.angulo) && esAnguloPlegable(pliegue.angulo)) && (
        <p role="status" className="text-sm text-amber-600">
          Hay ángulos críticos mayores de {ANGULO_CRITICO_PLEGADO}°; pueden requerir dos pasadas.
        </p>
      )}

      <Button
        className="w-full"
        disabled={desarrolloPuntaA === undefined || desarrolloPuntaB === undefined || desarrolloTotal === undefined}
        onClick={() => {
          if (desarrolloPuntaA === undefined || desarrolloPuntaB === undefined || desarrolloTotal === undefined) return;
          navigate("/resultado-pieza", {
            state: {
              pliegues: [
                ...plieguesA.map((pliegue, i) => ({ punta: "A" as const, pliegue, calc: calcsA[i] })),
                ...plieguesB.map((pliegue, i) => ({ punta: "B" as const, pliegue, calc: calcsB[i] })),
              ],
              desarrolloPuntaA,
              desarrolloPuntaB,
              desarrolloTotal,
              espesor,
              material,
              radioInterior: defaultsAprobados.innerRadius,
            },
          });
        }}
      >
        <FileText className="w-4 h-4 mr-2" /> Ver Resultado de Pieza
      </Button>
    </div>
  );
};

const CalcBox = ({ label, value, unit = "mm" }: { label: string; value: number; unit?: string }) => (
  <div className="p-2 rounded border border-border bg-background/50">
    <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
    <div className="text-sm font-semibold tabular-nums">
      {value.toFixed(2)} <span className="text-[10px] font-normal">{unit}</span>
    </div>
  </div>
);

const ResultBox = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div className={`p-4 rounded-lg border ${highlight ? "border-primary bg-primary/10" : "border-border bg-muted/30"}`}>
    <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`text-2xl font-bold tabular-nums ${highlight ? "text-primary" : ""}`}>
      {value.toFixed(2)} <span className="text-sm font-normal">mm</span>
    </div>
  </div>
);

export default PlieguesPorPuntaPage;
