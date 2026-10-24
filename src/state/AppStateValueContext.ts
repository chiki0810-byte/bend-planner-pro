import { createContext } from "react";
import type { BendItemValue } from "@/components/BendItem";
import type { BendResult, CalculatorState } from "@/pages/Index";

export interface AppStateValue {
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
  invalidateResult: () => void;
  bumpHistory: () => void;
  handleCalculate: (
    res: BendResult,
    meta: { material: string; thickness: number; bends: BendItemValue[]; pieceLength: number },
  ) => void;
  handleLoad: (data: {
    material: string;
    thickness: number;
    pieceLength: number;
    bends: BendItemValue[];
    result: BendResult;
    name: string;
  }) => void;
  handleLoadTemplate: (s: CalculatorState) => void;
}

export const AppStateValueContext = createContext<AppStateValue | null>(null);
