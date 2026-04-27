import { useState } from "react";
import { Calculator } from "lucide-react";
import BendCalculator from "@/components/BendCalculator";
import ResultsPanel from "@/components/ResultsPanel";
import HistoryPanel from "@/components/HistoryPanel";

export interface SingleBendResult {
  order: number;
  angle: number;
  distanceFromPrevious: number;
  bendAllowance: number;
  recommendedRadius: number;
  kFactor: number;
}

export interface BendResult {
  bends: SingleBendResult[];
  totalDevelopedLength: number;
  pieceLength: number;
  totalDistance: number;
}

export interface CalculatorState {
  material: string;
  thickness: number;
  pieceLength: number;
  bends: { angle: number; distance: number }[];
  name?: string;
}

const Index = () => {
  const [result, setResult] = useState<BendResult | null>(null);
  const [currentMaterial, setCurrentMaterial] = useState<string>("");
  const [currentThickness, setCurrentThickness] = useState<number>(0);
  const [currentName, setCurrentName] = useState<string>("");
  const [initialState, setInitialState] = useState<CalculatorState | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const handleCalculate = (
    res: BendResult,
    meta: { material: string; thickness: number },
  ) => {
    setResult(res);
    setCurrentMaterial(meta.material);
    setCurrentThickness(meta.thickness);
  };

  const handleLoad = (data: {
    material: string;
    thickness: number;
    pieceLength: number;
    bends: { angle: number; distance: number }[];
    result: BendResult;
    name: string;
  }) => {
    setInitialState({
      material: data.material,
      thickness: data.thickness,
      pieceLength: data.pieceLength,
      bends: data.bends,
      name: data.name,
    });
    setCurrentName(data.name);
    setCurrentMaterial(data.material);
    setCurrentThickness(data.thickness);
    setResult(data.result);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Calculadora de Plegado
            </h1>
          </div>
          <p className="text-steel text-lg">
            Cálculo preciso de parámetros para plegado de láminas de acero — Funciona offline
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          <div className="space-y-6">
            <BendCalculator onCalculate={handleCalculate} initialState={initialState} />
            <HistoryPanel refreshKey={historyKey} onLoad={handleLoad} />
          </div>
          <ResultsPanel
            result={result}
            material={currentMaterial}
            thickness={currentThickness}
            pieceName={currentName}
            onPieceNameChange={setCurrentName}
            onSaved={() => setHistoryKey((k) => k + 1)}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
