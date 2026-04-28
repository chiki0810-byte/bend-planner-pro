import { Calculator } from "lucide-react";
import BendCalculator from "@/components/BendCalculator";
import ResultsPanel from "@/components/ResultsPanel";
import DevelopedView2D from "@/components/DevelopedView2D";
import { useAppState } from "@/state/AppStateContext";

const CalculadoraPage = () => {
  const {
    result, currentMaterial, currentThickness, currentLength,
    currentBends, currentName, initialState,
    handleCalculate, setCurrentName, bumpHistory,
  } = useAppState();

  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <Calculator className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Calculadora de Plegado</h1>
            <p className="text-sm text-muted-foreground">Parámetros, resultados y vista 2D</p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <BendCalculator onCalculate={handleCalculate} initialState={initialState} />
        <ResultsPanel
          result={result}
          material={currentMaterial}
          thickness={currentThickness}
          bends={currentBends}
          pieceLength={currentLength}
          pieceName={currentName}
          onPieceNameChange={setCurrentName}
          onSaved={bumpHistory}
        />
      </div>
      <DevelopedView2D result={result} pieceLength={currentLength} />
    </div>
  );
};

export default CalculadoraPage;
