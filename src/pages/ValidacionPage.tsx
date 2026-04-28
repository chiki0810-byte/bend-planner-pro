import { Factory } from "lucide-react";
import MachineValidationPanel from "@/components/MachineValidationPanel";
import { useAppState } from "@/state/AppStateContext";

const ValidacionPage = () => {
  const { result, currentBends, currentMaterial, currentThickness } = useAppState();
  return (
    <div className="min-h-full bg-gradient-to-b from-[hsl(218_45%_8%)] via-[hsl(218_40%_10%)] to-background">
      <div
        className="border-b border-sky-400/20 bg-[hsl(218_50%_6%)]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(210_100%_70%/0.06) 1px, transparent 1px), linear-gradient(90deg, hsl(210_100%_70%/0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-400/30 shadow-[0_0_20px_hsl(210_100%_50%/0.3)]">
              <Factory className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-sky-50">Validación por Máquina</h1>
              <p className="text-[11px] uppercase tracking-[0.25em] text-sky-300/70 mt-0.5">
                Stefa 8 m · Jordi PH6100-180 · Prensa 6 m
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <MachineValidationPanel
          result={result}
          bends={currentBends}
          material={currentMaterial}
          thickness={currentThickness}
        />
      </div>
    </div>
  );
};

export default ValidacionPage;
