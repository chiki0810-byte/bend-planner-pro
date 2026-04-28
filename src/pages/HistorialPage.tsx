import { FolderOpen } from "lucide-react";
import HistoryPanel from "@/components/HistoryPanel";
import TemplatesPanel from "@/components/TemplatesPanel";
import { useAppState } from "@/state/AppStateContext";

const HistorialPage = () => {
  const { historyKey, handleLoad, currentState, handleLoadTemplate } = useAppState();
  return (
    <div className="container mx-auto px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Historial y Plantillas</h1>
            <p className="text-sm text-muted-foreground">Recupera piezas guardadas o plantillas reutilizables</p>
          </div>
        </div>
      </header>
      <div className="grid lg:grid-cols-2 gap-4">
        <HistoryPanel refreshKey={historyKey} onLoad={handleLoad} />
        <TemplatesPanel currentState={currentState} onLoad={handleLoadTemplate} />
      </div>
    </div>
  );
};

export default HistorialPage;
