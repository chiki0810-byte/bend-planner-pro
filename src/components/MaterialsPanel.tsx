import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Save, Trash2 } from "lucide-react";
import { listMaterials, upsertMaterial, deleteMaterial, MaterialRow } from "@/lib/storage";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const THICKNESSES = [0.5, 0.6, 0.8, 1.0, 1.2, 1.5];

const MaterialsPanel = () => {
  const [rows, setRows] = useState<MaterialRow[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const refresh = () => listMaterials().then(setRows);
  useEffect(() => { refresh(); }, []);

  const grouped = rows.reduce<Record<string, MaterialRow[]>>((acc, r) => {
    (acc[r.material] ||= []).push(r);
    return acc;
  }, {});

  const updateField = async (r: MaterialRow, field: keyof MaterialRow, value: number) => {
    await upsertMaterial({ ...r, [field]: value });
    refresh();
  };

  const addMaterial = async () => {
    const name = newName.trim();
    if (!name) return;
    for (const t of THICKNESSES) {
      await upsertMaterial({
        material: name, thickness: t,
        bendAllowance90: t * 1.6, kFactor: 0.38, innerRadius: t * 1.5,
      });
    }
    setNewName("");
    setOpen(false);
    toast.success(`Material "${name}" añadido`);
    refresh();
  };

  const removeMaterial = async (mat: string) => {
    const list = grouped[mat] || [];
    for (const r of list) if (r.id) await deleteMaterial(r.id);
    toast.success(`Material "${mat}" eliminado`);
    refresh();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="w-5 h-5 text-primary" />
          Tabla de Materiales
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">+ Material</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo material</DialogTitle>
              <DialogDescription>
                Se crearán filas para todos los espesores ({THICKNESSES.join(', ')} mm) con valores por defecto.
              </DialogDescription>
            </DialogHeader>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Latón" />
            <DialogFooter>
              <Button onClick={addMaterial}>Añadir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {Object.entries(grouped).map(([mat, list]) => (
            <div key={mat} className="border rounded-lg p-3 bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{mat}</h4>
                <Button size="sm" variant="ghost"
                  className="h-7 text-destructive hover:text-destructive"
                  onClick={() => removeMaterial(mat)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-[60px_1fr_1fr_1fr] gap-1 text-[10px] text-muted-foreground mb-1">
                <span>Esp.</span><span>Ganancia 90°</span><span>Factor K</span><span>R interior</span>
              </div>
              {list.sort((a,b) => a.thickness - b.thickness).map(r => (
                <div key={r.id} className="grid grid-cols-[60px_1fr_1fr_1fr] gap-1 mb-1 items-center">
                  <span className="text-xs font-medium">{r.thickness} mm</span>
                  <Input type="number" step="0.01" defaultValue={r.bendAllowance90}
                    onBlur={(e) => updateField(r, 'bendAllowance90', parseFloat(e.target.value))}
                    className="h-7 text-xs" />
                  <Input type="number" step="0.01" defaultValue={r.kFactor}
                    onBlur={(e) => updateField(r, 'kFactor', parseFloat(e.target.value))}
                    className="h-7 text-xs" />
                  <Input type="number" step="0.1" defaultValue={r.innerRadius}
                    onBlur={(e) => updateField(r, 'innerRadius', parseFloat(e.target.value))}
                    className="h-7 text-xs" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Los cambios se guardan localmente al salir de cada celda.
        </p>
      </CardContent>
    </Card>
  );
};

export default MaterialsPanel;
