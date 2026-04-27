import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Trash2, FolderOpen } from "lucide-react";
import { listPieces, deletePiece, SavedPiece } from "@/lib/storage";
import { BendResult } from "@/pages/Index";
import { toast } from "sonner";

interface HistoryPanelProps {
  refreshKey: number;
  onLoad: (data: {
    material: string;
    thickness: number;
    pieceLength: number;
    bends: { angle: number; distance: number }[];
    result: BendResult;
    name: string;
  }) => void;
}

const HistoryPanel = ({ refreshKey, onLoad }: HistoryPanelProps) => {
  const [items, setItems] = useState<SavedPiece[]>([]);

  const refresh = async () => {
    try {
      setItems(await listPieces());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refresh();
  }, [refreshKey]);

  const handleDelete = async (id: number) => {
    await deletePiece(id);
    toast.success("Pieza eliminada");
    refresh();
  };

  const handleLoad = (p: SavedPiece) => {
    try {
      const payload = JSON.parse(p.payload);
      onLoad({
        material: p.material,
        thickness: p.thickness,
        pieceLength: p.pieceLength,
        bends: payload.bends,
        result: payload.result,
        name: p.name,
      });
      toast.success(`Pieza "${p.name}" cargada`);
    } catch {
      toast.error("Error al cargar la pieza");
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5 text-primary" />
          Historial de Piezas ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aún no hay piezas guardadas
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {items.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-muted/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {p.material}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {p.thickness} mm
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleLoad(p)}>
                  <FolderOpen className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(p.id!)}
                  className="text-destructive hover:text-destructive"
                >
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

export default HistoryPanel;
