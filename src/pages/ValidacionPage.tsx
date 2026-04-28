import { Factory } from "lucide-react";
import MachineValidationPanel from "@/components/MachineValidationPanel";
import { useAppState } from "@/state/AppStateContext";

const ValidacionPage = () => {
  const { result, currentBends, currentMaterial, currentThickness } = useAppState();
  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <Factory className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Validación por Máquina</h1>
            <p className="text-sm text-muted-foreground">Stefa 8 m · Jordi PH6100-180 · Prensa 6 m</p>
          </div>
        </div>
      </header>
      <MachineValidationPanel
        result={result}
        bends={currentBends}
        material={currentMaterial}
        thickness={currentThickness}
      />
    </div>
  );
};

export default ValidacionPage;
