import { useState } from "react";
import { Calculator } from "lucide-react";
import BendCalculator from "@/components/BendCalculator";
import ResultsPanel from "@/components/ResultsPanel";

export interface BendResult {
  bendAllowance: number;
  developedLength: number;
  recommendedRadius: number;
  kFactor: number;
}

const Index = () => {
  const [result, setResult] = useState<BendResult | null>(null);

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
            Cálculo preciso de parámetros para plegado de láminas de acero
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          <BendCalculator onCalculate={setResult} />
          <ResultsPanel result={result} />
        </div>
      </div>
    </div>
  );
};

export default Index;
