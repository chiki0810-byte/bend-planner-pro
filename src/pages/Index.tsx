import { useState } from "react";
import { Calculator } from "lucide-react";
import BendCalculator from "@/components/BendCalculator";
import ResultsPanel from "@/components/ResultsPanel";
import HistoryPanel from "@/components/HistoryPanel";
import DevelopedView2D from "@/components/DevelopedView2D";
import MaterialsPanel from "@/components/MaterialsPanel";
import TemplatesPanel from "@/components/TemplatesPanel";
import MachineValidationPanel from "@/components/MachineValidationPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BendOutput } from "@/lib/bendCalc";
import { BendItemValue } from "@/components/BendItem";

export type SingleBendResult = BendOutput;

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
  bends: BendItemValue[];
  name?: string;
}

const Index = () => {
  const [result, setResult] = useState<BendResult | null>(null);
  const [currentMaterial, setCurrentMaterial] = useState<string>("");
  const [currentThickness, setCurrentThickness] = useState<number>(0);
  const [currentLength, setCurrentLength] = useState<number>(0);
  const [currentBends, setCurrentBends] = useState<BendItemValue[]>([]);
  const [currentName, setCurrentName] = useState<string>("");
  const [initialState, setInitialState] = useState<CalculatorState | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const handleCalculate = (
    res: BendResult,
    meta: { material: string; thickness: number; bends: BendItemValue[]; pieceLength: number },
  ) => {
    setResult(res);
    setCurrentMaterial(meta.material);
    setCurrentThickness(meta.thickness);
    setCurrentLength(meta.pieceLength);
    setCurrentBends(meta.bends);
  };

  const handleLoad = (data: {
    material: string; thickness: number; pieceLength: number;
    bends: BendItemValue[]; result: BendResult; name: string;
  }) => {
    setInitialState({
      material: data.material, thickness: data.thickness,
      pieceLength: data.pieceLength, bends: data.bends, name: data.name,
    });
    setCurrentName(data.name);
    setCurrentMaterial(data.material);
    setCurrentThickness(data.thickness);
    setCurrentLength(data.pieceLength);
    setCurrentBends(data.bends);
    setResult(data.result);
  };

  const handleLoadTemplate = (s: CalculatorState) => {
    setInitialState(s);
    if (s.name) setCurrentName(s.name);
  };

  const currentState: CalculatorState | null = result ? {
    material: currentMaterial, thickness: currentThickness,
    pieceLength: currentLength, bends: currentBends, name: currentName,
  } : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Calculator className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Calculadora de Plegado</h1>
          </div>
          <p className="text-steel text-sm">
            Cálculo profesional de plegado de chapa — Funciona 100% offline
          </p>
        </header>

        <Tabs defaultValue="calc" className="max-w-7xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="calc">Pieza y Resultados</TabsTrigger>
            <TabsTrigger value="library">Historial y Plantillas</TabsTrigger>
            <TabsTrigger value="materials">Materiales</TabsTrigger>
          </TabsList>

          <TabsContent value="calc" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <BendCalculator onCalculate={handleCalculate} initialState={initialState} />
              <ResultsPanel
                result={result}
                material={currentMaterial}
                thickness={currentThickness}
                bends={currentBends}
                pieceLength={currentLength}
                pieceName={currentName}
                onPieceNameChange={setCurrentName}
                onSaved={() => setHistoryKey((k) => k + 1)}
              />
            </div>
            <DevelopedView2D result={result} pieceLength={currentLength} />
            <MachineValidationPanel
              result={result}
              bends={currentBends}
              material={currentMaterial}
              thickness={currentThickness}
            />
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <HistoryPanel refreshKey={historyKey} onLoad={handleLoad} />
              <TemplatesPanel currentState={currentState} onLoad={handleLoadTemplate} />
            </div>
          </TabsContent>

          <TabsContent value="materials">
            <MaterialsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
