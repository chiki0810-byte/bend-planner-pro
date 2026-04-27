import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Save } from "lucide-react";
import { BendResult } from "@/pages/Index";
import { Separator } from "@/components/ui/separator";
import { exportBendPdf } from "@/lib/pdfExport";
import { savePiece } from "@/lib/storage";
import { toast } from "sonner";

interface ResultsPanelProps {
  result: BendResult | null;
  material: string;
  thickness: number;
  pieceName: string;
  onPieceNameChange: (n: string) => void;
  onSaved: () => void;
}

const ResultsPanel = ({
  result,
  material,
  thickness,
  pieceName,
  onPieceNameChange,
  onSaved,
}: ResultsPanelProps) => {
  if (!result) {
    return (
      <Card className="shadow-lg bg-muted/30">
        <CardHeader>
          <CardTitle>Resultados del Cálculo</CardTitle>
          <CardDescription>
            Los resultados aparecerán aquí después de calcular
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground text-center">
            Completa los parámetros y presiona "Calcular Plegado" para ver los resultados
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleExportPDF = () => {
    try {
      exportBendPdf({ result, material, thickness, pieceName });
      toast.success("PDF generado");
    } catch (e) {
      console.error(e);
      toast.error("Error al generar PDF");
    }
  };

  const handleSave = async () => {
    if (!pieceName.trim()) {
      toast.error("Indica un nombre para la pieza");
      return;
    }
    try {
      await savePiece({
        name: pieceName.trim(),
        thickness,
        material,
        pieceLength: result.pieceLength,
        payload: JSON.stringify({
          bends: result.bends.map((b) => ({
            angle: b.angle,
            distance: b.distanceFromPrevious,
          })),
          result,
        }),
      });
      toast.success(`Pieza "${pieceName}" guardada localmente`);
      onSaved();
    } catch (e) {
      console.error(e);
      toast.error("Error al guardar");
    }
  };

  return (
    <Card className="shadow-lg border-accent/20">
      <CardHeader>
        <CardTitle className="text-primary">Resultados del Cálculo</CardTitle>
        <CardDescription>Parámetros calculados para todos los plegados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-br from-primary/10 to-technical/10 p-5 rounded-lg border-2 border-primary/20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Longitud de Pieza</p>
              <p className="text-2xl font-bold text-foreground">{result.pieceLength} mm</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Longitud Desarrollada Total</p>
              <p className="text-3xl font-bold text-primary">{result.totalDevelopedLength} mm</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {result.bends.length} {result.bends.length === 1 ? "Plegado" : "Plegados"}
            </Badge>
            <Badge variant="secondary" className="bg-technical/20 text-technical-foreground">
              Distancia total: {result.totalDistance} mm
            </Badge>
            {material && (
              <Badge variant="outline">{material} · {thickness} mm</Badge>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Secuencia de Plegados</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {result.bends.map((bend, index) => (
              <div key={index} className="bg-card p-4 rounded-lg border space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground h-7 w-7 rounded-full p-0 flex items-center justify-center font-bold">
                      {bend.order}
                    </Badge>
                    <h4 className="font-semibold text-sm">Plegado {bend.order}</h4>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary">
                    {bend.angle}°
                  </Badge>
                </div>

                <div className="bg-muted/40 px-3 py-2 rounded text-xs text-muted-foreground">
                  {index === 0
                    ? `↦ A ${bend.distanceFromPrevious} mm desde el borde`
                    : `↦ A ${bend.distanceFromPrevious} mm desde el plegado ${bend.order - 1}`}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Ganancia</p>
                    <p className="text-lg font-bold text-technical">{bend.bendAllowance} mm</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Radio</p>
                    <p className="text-lg font-bold text-primary">{bend.recommendedRadius} mm</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Factor K</p>
                    <p className="text-lg font-bold text-steel-dark">{bend.kFactor}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label htmlFor="pieceName">Nombre de la pieza</Label>
          <Input
            id="pieceName"
            placeholder="Ej: Soporte lateral A"
            value={pieceName}
            onChange={(e) => onPieceNameChange(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Guardar pieza
            </Button>
            <Button onClick={handleExportPDF} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Datos guardados localmente en este dispositivo · 100% offline
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsPanel;
