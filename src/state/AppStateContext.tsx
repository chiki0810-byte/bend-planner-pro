import { useState, type ReactNode } from "react";
import { AppStateValueContext as Ctx, type AppStateValue } from "@/state/AppStateValueContext";
import type { BendItemValue } from "@/components/BendItem";
import type { BendResult, CalculatorState } from "@/pages/Index";

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [result, setResult] = useState<BendResult | null>(null);
  const [currentMaterial, setCurrentMaterial] = useState<string>("");
  const [currentThickness, setCurrentThickness] = useState<number>(0);
  const [currentLength, setCurrentLength] = useState<number>(0);
  const [currentBends, setCurrentBends] = useState<BendItemValue[]>([]);
  const [currentName, setCurrentName] = useState<string>("");
  const [initialState, setInitialState] = useState<CalculatorState | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const handleCalculate: AppStateValue["handleCalculate"] = (res, meta) => {
    setResult(res);
    setCurrentMaterial(meta.material);
    setCurrentThickness(meta.thickness);
    setCurrentLength(meta.pieceLength);
    setCurrentBends(meta.bends);
  };

  const handleLoad: AppStateValue["handleLoad"] = (data) => {
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

  const handleLoadTemplate: AppStateValue["handleLoadTemplate"] = (s) => {
    setInitialState(s);
    if (s.name) setCurrentName(s.name);
  };

  const currentState: CalculatorState | null = result ? {
    material: currentMaterial, thickness: currentThickness,
    pieceLength: currentLength, bends: currentBends, name: currentName,
  } : null;

  return (
    <Ctx.Provider value={{
      result, currentMaterial, currentThickness, currentLength,
      currentBends, currentName, initialState, historyKey, currentState,
      setCurrentName, invalidateResult: () => setResult(null),
      bumpHistory: () => setHistoryKey(k => k + 1),
      handleCalculate, handleLoad, handleLoadTemplate,
    }}>
      {children}
    </Ctx.Provider>
  );
};
