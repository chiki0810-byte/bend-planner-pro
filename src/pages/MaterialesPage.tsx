import { Layers } from "lucide-react";
import MaterialsPanel from "@/components/MaterialsPanel";

const MaterialesPage = () => (
  <div className="container mx-auto px-4 py-6">
    <header className="mb-6">
      <div className="flex items-center gap-3">
        <Layers className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Materiales</h1>
          <p className="text-sm text-muted-foreground">Tabla editable de materiales, espesores, K y radio</p>
        </div>
      </div>
    </header>
    <MaterialsPanel />
  </div>
);

export default MaterialesPage;
