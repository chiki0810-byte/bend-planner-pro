import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileStack, Trash2, FolderOpen, Save } from "lucide-react";
import { listTemplates, saveTemplate, deleteTemplate, Template } from "@/lib/storage";
import { CalculatorState } from "@/pages/Index";
import { toast } from "sonner";

interface TemplatesPanelProps {
  currentState: CalculatorState | null;
  onLoad: (s: CalculatorState) => void;
}

const TemplatesPanel = ({ currentState, onLoad }: TemplatesPanelProps) => {
  const [items, setItems] = useState<Template[]>([]);
  const [name, setName] = useState("");

  const refresh = () => listTemplates().then(setItems);
  useEffect(() => { refresh(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Indica un nombre");
    if (!currentState) return toast.error("Calcula una pieza primero");
    await saveTemplate({ name: name.trim(), payload: JSON.stringify(currentState) });
    toast.success("Plantilla guardada");
    setName("");
    refresh();
  };

  const handleLoad = (t: Template) => {
    try {
      const s = JSON.parse(t.payload) as CalculatorState;
      onLoad(s);
      toast.success(`Plantilla "${t.name}" cargada`);
    } catch {
      toast.error("Error al cargar");
    }
  };

  const handleDelete = async (id: number) => {
    await deleteTemplate(id);
    refresh();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileStack className="w-5 h-5 text-primary" />
          Plantillas ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Nombre de plantilla" value={name}
            onChange={(e) => setName(e.target.value)} className="h-9" />
          <Button onClick={handleSave} size="sm" disabled={!currentState}>
            <Save className="w-4 h-4 mr-1" /> Guardar
          </Button>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Sin plantillas guardadas
          </p>
        ) : (
          <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
            {items.map(t => (
              <div key={t.id} className="flex items-center gap-2 p-2 rounded border bg-muted/20">
                <span className="flex-1 text-sm truncate">{t.name}</span>
                <Button size="sm" variant="ghost" onClick={() => handleLoad(t)} className="h-7 w-7 p-0">
                  <FolderOpen className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id!)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplatesPanel;
