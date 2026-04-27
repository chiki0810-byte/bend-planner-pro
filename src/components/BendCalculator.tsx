import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, Plus } from "lucide-react";
import { BendResult, SingleBendResult } from "@/pages/Index";
import BendItem from "./BendItem";

interface BendCalculatorProps {
  onCalculate: (result: BendResult) => void;
}

// Datos de ganancia de plegado por espesor (en mm)
const bendAllowanceData: Record<number, number> = {
  0.5: 0.8,
  0.6: 1.0,
  0.8: 1.3,
  1.0: 1.6,
  1.2: 1.9,
  1.5: 2.4,
};

// Factor K típico por espesor
const kFactorData: Record<number, number> = {
  0.5: 0.33,
  0.6: 0.33,
  0.8: 0.35,
  1.0: 0.38,
  1.2: 0.40,
  1.5: 0.42,
};

const materialTypes = [
  "Acero al carbono",
  "Acero inoxidable",
  "Aluminio",
  "Galvanizado",
];

interface Bend {
  id: string;
  angle: number;
  distance: number;
}

const BendCalculator = ({ onCalculate }: BendCalculatorProps) => {
  const [thickness, setThickness] = useState<string>("");
  const [material, setMaterial] = useState<string>("");
  const [pieceLength, setPieceLength] = useState<string>("");
  const [bends, setBends] = useState<Bend[]>([
    { id: crypto.randomUUID(), angle: 90, distance: 50 }
  ]);

  const addBend = () => {
    setBends([...bends, { id: crypto.randomUUID(), angle: 90, distance: 50 }]);
  };

  const removeBend = (id: string) => {
    setBends(bends.filter(bend => bend.id !== id));
  };

  const updateBendAngle = (id: string, angle: number) => {
    setBends(bends.map(bend => 
      bend.id === id ? { ...bend, angle } : bend
    ));
  };

  const updateBendDistance = (id: string, distance: number) => {
    setBends(bends.map(bend =>
      bend.id === id ? { ...bend, distance } : bend
    ));
  };

  const calculateBend = () => {
    if (!thickness || !material || !pieceLength) {
      return;
    }

    const t = parseFloat(thickness);
    const L = parseFloat(pieceLength);

    const bendResults: SingleBendResult[] = bends.map((bend, idx) => {
      const baseBendAllowance = bendAllowanceData[t] || 1.5;
      const bendAllowance = baseBendAllowance * (bend.angle / 90);
      const recommendedRadius = t * 1.5;
      const kFactor = kFactorData[t] || 0.35;

      return {
        order: idx + 1,
        angle: bend.angle,
        distanceFromPrevious: bend.distance,
        bendAllowance: Number(bendAllowance.toFixed(2)),
        recommendedRadius: Number(recommendedRadius.toFixed(2)),
        kFactor: Number(kFactor.toFixed(3)),
      };
    });

    const totalBendAllowance = bendResults.reduce((sum, b) => sum + b.bendAllowance, 0);
    const totalDistance = bendResults.reduce((sum, b) => sum + b.distanceFromPrevious, 0);
    const totalDevelopedLength = L + totalBendAllowance;

    const result: BendResult = {
      bends: bendResults,
      totalDevelopedLength: Number(totalDevelopedLength.toFixed(2)),
      pieceLength: L,
      totalDistance: Number(totalDistance.toFixed(2)),
    };

    onCalculate(result);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Parámetros de Entrada
        </CardTitle>
        <CardDescription>
          Introduce los datos de tu pieza para calcular el plegado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="thickness">Espesor (mm)</Label>
          <Select value={thickness} onValueChange={setThickness}>
            <SelectTrigger id="thickness">
              <SelectValue placeholder="Selecciona el espesor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5 mm</SelectItem>
              <SelectItem value="0.6">0.6 mm</SelectItem>
              <SelectItem value="0.8">0.8 mm</SelectItem>
              <SelectItem value="1.0">1.0 mm</SelectItem>
              <SelectItem value="1.2">1.2 mm</SelectItem>
              <SelectItem value="1.5">1.5 mm</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="material">Tipo de Material</Label>
          <Select value={material} onValueChange={setMaterial}>
            <SelectTrigger id="material">
              <SelectValue placeholder="Selecciona el material" />
            </SelectTrigger>
            <SelectContent>
              {materialTypes.map((mat) => (
                <SelectItem key={mat} value={mat}>
                  {mat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="length">Longitud de Pieza (mm)</Label>
          <Input
            id="length"
            type="number"
            placeholder="Ej: 500"
            value={pieceLength}
            onChange={(e) => setPieceLength(e.target.value)}
            min="0"
            step="0.1"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Plegados ({bends.length})</Label>
            <Button
              onClick={addBend}
              variant="outline"
              size="sm"
              className="h-8"
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {bends.map((bend, index) => (
              <BendItem
                key={bend.id}
                index={index}
                angle={bend.angle}
                distance={bend.distance}
                onAngleChange={(angle) => updateBendAngle(bend.id, angle)}
                onDistanceChange={(distance) => updateBendDistance(bend.id, distance)}
                onRemove={() => removeBend(bend.id)}
                canRemove={bends.length > 1}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={calculateBend}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
          disabled={!thickness || !material || !pieceLength}
        >
          <Calculator className="w-4 h-4 mr-2" />
          Calcular Plegado
        </Button>
      </CardContent>
    </Card>
  );
};

export default BendCalculator;
