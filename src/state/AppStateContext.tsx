import { createContext, ReactNode, useContext, useState } from "react";
import { BendItemValue } from "@/components/BendItem";
import { BendResult, CalculatorState } from "@/pages/Index";

interface AppStateValue {
  result: BendResult | null;
  currentMaterial: string;
  currentThickness: number;
  currentLength: number;
  currentBends: BendItemValue[];
  currentName: string;
  initialState: CalculatorState | null;
  historyKey: number;
  currentState: CalculatorState | null;
  setCurrentName: (n: string) => void;
  bumpHistory: () => void;
  handleCalculate: (
    res: BendResult,
    meta: { material: string; thickness: number; bends: BendItemValue[]; pieceLength: number },
  ) => void;
  handleLoad: (data: {
    material: string; thickness: number; pieceLength: number;
    bends: BendItemValue[]; result: BendResult; name: string;
  }) => void;
  handleLoadTemplate: (s: CalculatorState) => void;
}

const Ctx = createContext<AppStateValue | null>(null);

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
      setCurrentName, bumpHistory: () => setHistoryKey(k => k + 1),
      handleCalculate, handleLoad, handleLoadTemplate,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAppState = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used within AppStateProvider");
  return v;
};
