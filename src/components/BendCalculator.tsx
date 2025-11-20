import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Calculator } from "lucide-react";
import { BendResult } from "@/pages/Index";

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

const BendCalculator = ({ onCalculate }: BendCalculatorProps) => {
  const [thickness, setThickness] = useState<string>("");
  const [material, setMaterial] = useState<string>("");
  const [pieceLength, setPieceLength] = useState<string>("");
  const [bendAngle, setBendAngle] = useState<number>(90);

  const calculateBend = () => {
    if (!thickness || !material || !pieceLength) {
      return;
    }

    const t = parseFloat(thickness);
    const L = parseFloat(pieceLength);
    const angle = bendAngle;

    // Ganancia de plegado base
    const baseBendAllowance = bendAllowanceData[t] || 1.5;
    
    // Ajustar ganancia según ángulo (90° es base, otros ángulos se ajustan proporcionalmente)
    const bendAllowance = baseBendAllowance * (angle / 90);

    // Radio recomendado (típicamente 1.5 veces el espesor para acero)
    const recommendedRadius = t * 1.5;

    // Factor K
    const kFactor = kFactorData[t] || 0.35;

    // Longitud desarrollada: L + ganancia de plegado
    const developedLength = L + bendAllowance;

    const result: BendResult = {
      bendAllowance: Number(bendAllowance.toFixed(2)),
      developedLength: Number(developedLength.toFixed(2)),
      recommendedRadius: Number(recommendedRadius.toFixed(2)),
      kFactor: Number(kFactor.toFixed(3)),
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="angle">Ángulo de Plegado</Label>
            <span className="text-lg font-semibold text-primary">{bendAngle}°</span>
          </div>
          <Slider
            id="angle"
            value={[bendAngle]}
            onValueChange={(values) => setBendAngle(values[0])}
            min={30}
            max={180}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>30°</span>
            <span>90°</span>
            <span>180°</span>
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
