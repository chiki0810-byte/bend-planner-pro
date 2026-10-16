import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Plus } from "lucide-react";
import { BendResult, CalculatorState } from "@/pages/Index";
import BendItem, { BendItemValue } from "./BendItem";
import { computeBend, computeDevelopment, DefaultsByThickness } from "@/lib/bendCalc";
import { getMaterialDefaultsWithCalibration, listMaterials } from "@/lib/storage";
import { toast } from "sonner";

interface BendCalculatorProps {
  onCalculate: (
    result: BendResult,
    meta: { material: string; thickness: number; bends: BendItemValue[]; pieceLength: number },
  ) => void;
  initialState?: CalculatorState | null;
}

const BASE_THICKNESSES = [0.5, 0.6, 0.8, 1.0, 1.2, 1.5];

interface BendRow extends BendItemValue {
  id: string;
  manualR?: boolean;
  manualK?: boolean;
}

const newBend = (defRadius: number, defK: number): BendRow => ({
  id: crypto.randomUUID(),
  angle: 90,
  distance: 50,
  innerRadius: defRadius,
  kFactor: defK,
  direction: 1,
  tolerance: 0.1,
});

const BendCalculator = ({ onCalculate, initialState }: BendCalculatorProps) => {
  const [thickness, setThickness] = useState<string>("");
  const [material, setMaterial] = useState<string>("");
  const [pieceLength, setPieceLength] = useState<string>("");
  const [materials, setMaterials] = useState<string[]>([]);
  const [defaults, setDefaults] = useState<DefaultsByThickness | undefined>(undefined);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [bends, setBends] = useState<BendRow[]>([newBend(Number.NaN, Number.NaN)]);
  const [resolvedKey, setResolvedKey] = useState("");
  const combinationKey = `${material}|${thickness}`;
  const ready = !!material && !!thickness && resolvedKey === combinationKey;
  const validBend = (b: BendRow) => Number.isFinite(b.innerRadius) && b.innerRadius >= 0 &&
    Number.isFinite(b.kFactor) && b.kFactor >= 0 && b.kFactor <= 0.5;
  const canCalculate = ready && Number.isFinite(Number(pieceLength)) && Number(pieceLength) > 0 &&
    bends.length > 0 && bends.every(b => validBend(b) && (isCalibrated || (b.manualR && b.manualK)));

  const availableThicknesses = useMemo(
    () => (material === "Galvanizado" ? [...BASE_THICKNESSES, 2.0] : BASE_THICKNESSES),
    [material],
  );

  // Resetear espesor si el material cambiado no lo soporta
  useEffect(() => {
    const t = parseFloat(thickness);
    if (material && thickness && !availableThicknesses.some(x => Math.abs(x - t) < 1e-6)) {
      setThickness("");
    }
  }, [material, availableThicknesses, thickness]);

  // Cargar materiales únicos desde storage
  useEffect(() => {
    listMaterials().then(rows => {
      const uniq = Array.from(new Set(rows.map(r => r.material)));
      setMaterials(uniq);
    }).catch(() => toast.error("No se pudieron cargar los materiales."));
  }, []);

  // Recargar defaults al cambiar material/espesor y sincronizar plegados no editados
  useEffect(() => {
    const t = parseFloat(thickness);
    setDefaults(undefined);
    setIsCalibrated(false);
    setResolvedKey("");
    // La procedencia manual solo pertenece a la combinación actual, nunca a otra.
    setBends(prev => prev.map(b => ({
      ...b, innerRadius: Number.NaN, kFactor: Number.NaN, manualR: false, manualK: false,
    })));
    if (!material || !t) return;
    let cancelled = false;
    getMaterialDefaultsWithCalibration(material, t).then(({ defaults: def, calibrated }) => {
      if (cancelled) return;
      setIsCalibrated(calibrated);
      setDefaults(def);
      setResolvedKey(`${material}|${thickness}`);
      if (calibrated && def) {
        setBends(prev => prev.map(b => ({
          ...b,
          innerRadius: b.manualR ? b.innerRadius : def.innerRadius,
          kFactor: b.manualK ? b.kFactor : def.kFactor,
        })));
      }
    }).catch(() => {
      if (!cancelled) toast.error("No se pudo comprobar la calibración del material. Inténtalo de nuevo.");
    });
    return () => { cancelled = true; };
  }, [material, thickness]);

  useEffect(() => {
    if (!initialState) return;
    setThickness(String(initialState.thickness));
    setMaterial(initialState.material);
    setPieceLength(String(initialState.pieceLength));
    setBends(initialState.bends.map(b => ({
      id: crypto.randomUUID(), ...b, innerRadius: Number.NaN, kFactor: Number.NaN,
      manualR: false, manualK: false,
    })));
  }, [initialState]);

  const addBend = () => {
    const defRadius = ready && isCalibrated && defaults ? defaults.innerRadius : Number.NaN;
    const defK = ready && isCalibrated && defaults ? defaults.kFactor : Number.NaN;
    setBends([...bends, newBend(defRadius, defK)]);
  };
  const removeBend = (id: string) => setBends(bends.filter(b => b.id !== id));
  const updateBend = (id: string, v: BendItemValue, field: keyof BendItemValue) =>
    setBends(bends.map(b => b.id === id ? {
      ...b, ...v,
      manualR: b.manualR || field === "innerRadius",
      manualK: b.manualK || field === "kFactor",
    } : b));


  const calculate = () => {
    const t = parseFloat(thickness);
    const L = parseFloat(pieceLength);
    if (!canCalculate) return;
    try {

    const bendResults = bends.map((b, i) =>
      computeBend(
        {
          angle: b.angle, distance: b.distance,
          innerRadius: b.innerRadius,
          kFactor: b.kFactor,
          direction: b.direction, tolerance: b.tolerance,
          associatedDimension: b.associatedDimension,
          criticalDimension: b.criticalDimension,
          compensationAllowed: b.compensationAllowed,
          compensationAmount: b.compensationAmount,
          dimensionReference: b.dimensionReference,
        },
        t, isCalibrated ? defaults : undefined, i + 1,
      ),
    );

    // Motor único (bendCalc.ts): capas separadas cotas / teórico / taller / corte
    const development = computeDevelopment(L, bendResults, 0);
    const totalDist = bendResults.reduce((s, r) => s + r.distanceFromPrevious, 0);

    const result: BendResult = {
      bends: bendResults,
      totalDevelopedLength: development.theoreticalDevelopedLength,
      pieceLength: L,
      totalDistance: Number(totalDist.toFixed(2)),
      development,
    };

    onCalculate(result, {
      material, thickness: t, pieceLength: L,
      bends: bends.map(({ id, manualR, manualK, ...rest }) => rest),

    });
    } catch {
      toast.error("No se pudo calcular. Revisa el radio interior y el factor K de cada pliegue.");
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Parámetros de Entrada
        </CardTitle>
        <CardDescription>Datos de la pieza y de cada plegado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Espesor (mm)</Label>
            <Select value={thickness} onValueChange={setThickness}>
            <SelectTrigger aria-label="Espesor"><SelectValue placeholder="Espesor" /></SelectTrigger>
              <SelectContent>
                {availableThicknesses.map(t => (
                  <SelectItem key={t} value={String(t)}>{t} mm</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Material</Label>
            <Select value={material} onValueChange={setMaterial}>
              <SelectTrigger aria-label="Material"><SelectValue placeholder="Material" /></SelectTrigger>
              <SelectContent>
                {materials.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Longitud de Pieza (mm)</Label>
          <Input type="number" placeholder="Ej: 500" value={pieceLength}
            onChange={(e) => setPieceLength(e.target.value)} min="0" step="0.1" />
        </div>

        {material && thickness && (
          <div className={`text-xs p-2 rounded border ${isCalibrated ? "text-muted-foreground bg-muted/40" : "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900"}`}>
            {!ready ? "Comprobando calibración…" : isCalibrated && defaults ? (
              <>
                Defaults para {material} {thickness}mm — R int: <b>{defaults.innerRadius}</b> ·
                K: <b>{defaults.kFactor}</b>
              </>
            ) : (
              <>
                Espesor {thickness} mm de {material}: <b>sin calibración aprobada</b>. Introduce R interior y K válidos en cada pliegue o calibra en Materiales.
              </>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Plegados ({bends.length})</Label>
            <Button onClick={addBend} variant="outline" size="sm" className="h-8">
              <Plus className="w-4 h-4 mr-1" />Agregar
            </Button>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {bends.map((b, i) => (
              <BendItem
                key={b.id}
                index={i}
                value={b}
                onChange={(v, field) => updateBend(b.id, v, field)}
                onRemove={() => removeBend(b.id)}
                canRemove={bends.length > 1}
                defaultRadius={ready ? defaults?.innerRadius : undefined}
                defaultK={ready ? defaults?.kFactor : undefined}
              />
            ))}
          </div>
        </div>

        <Button onClick={calculate} className="w-full" size="lg"
          disabled={!canCalculate}>
          <Calculator className="w-4 h-4 mr-2" />
          Calcular Plegado
        </Button>
      </CardContent>
    </Card>
  );
};

export default BendCalculator;
