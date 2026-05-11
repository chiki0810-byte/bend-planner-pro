import { LayoutTemplate } from "lucide-react";
import TemplatesPanel from "@/components/TemplatesPanel";
import { useAppState } from "@/state/AppStateContext";

const PlantillasPage = () => {
  const { currentState, handleLoadTemplate } = useAppState();
  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <LayoutTemplate className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Plantillas</h1>
          <p className="text-sm text-muted-foreground">Plantillas reutilizables de piezas</p>
        </div>
      </header>
      <TemplatesPanel currentState={currentState} onLoad={handleLoadTemplate} />
    </div>
  );
};

export default PlantillasPage;
