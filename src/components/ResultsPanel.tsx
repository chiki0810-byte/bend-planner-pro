import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Save, FileSpreadsheet, FileCode } from "lucide-react";
import { BendResult } from "@/pages/Index";
import { Separator } from "@/components/ui/separator";
import { exportBendPdf } from "@/lib/pdfExport";
import { exportBendDxf } from "@/lib/dxfExport";
import { exportBendXlsx } from "@/lib/xlsxExport";
import { savePiece } from "@/lib/storage";
import { toast } from "sonner";
import { BendItemValue } from "./BendItem";

interface ResultsPanelProps {
  result: BendResult | null;
  material: string;
  thickness: number;
  bends: BendItemValue[];
  pieceLength: number;
  pieceName: string;
  onPieceNameChange: (n: string) => void;
  onSaved: () => void;
}

const ResultsPanel = ({
  result, material, thickness, bends, pieceLength,
  pieceName, onPieceNameChange, onSaved,
}: ResultsPanelProps) => {
  if (!result) {
    return (
      <Card className="shadow-lg bg-muted/30">
        <CardHeader>
          <CardTitle>Resultados del Cálculo</CardTitle>
          <CardDescription>Aparecerán aquí tras calcular</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground text-center">
            Completa los parámetros y presiona "Calcular Plegado"
          </p>
        </CardContent>
      </Card>
    );
  }

  const handlePDF = () => {
    try { exportBendPdf({ result, material, thickness, pieceName }); toast.success("PDF generado"); }
    catch (e) { console.error(e); toast.error("Error al generar PDF"); }
  };
  const handleDXF = () => {
    try { exportBendDxf({ result, pieceName }); toast.success("DXF generado"); }
    catch (e) { console.error(e); toast.error("Error al generar DXF"); }
  };
  const handleXLSX = () => {
    try { exportBendXlsx({ result, material, thickness, pieceName }); toast.success("Excel generado"); }
    catch (e) { console.error(e); toast.error("Error al generar Excel"); }
  };

  const handleSave = async () => {
    if (!pieceName.trim()) return toast.error("Indica un nombre para la pieza");
    try {
      await savePiece({
        name: pieceName.trim(), thickness, material, pieceLength,
        payload: JSON.stringify({ bends, result }),
      });
      toast.success(`Pieza "${pieceName}" guardada`);
      onSaved();
    } catch (e) { console.error(e); toast.error("Error al guardar"); }
  };

  return (
    <Card className="shadow-lg border-accent/20">
      <CardHeader>
        <CardTitle className="text-primary">Resultados del Cálculo</CardTitle>
        <CardDescription>Parámetros calculados con fórmula BA = (π/180)·θ·(R + K·t)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="bg-gradient-to-br from-primary/10 to-technical/10 p-4 rounded-lg border-2 border-primary/20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Longitud de Pieza</p>
              <p className="text-xl font-bold">{result.pieceLength} mm</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Desarrollado Total</p>
              <p className="text-2xl font-bold text-primary">{result.totalDevelopedLength} mm</p>
            </div>
          </div>
          <div className="mt-2 flex gap-2 flex-wrap">
            <Badge variant="secondary">{result.bends.length} plegado(s)</Badge>
            <Badge variant="secondary">Σ dist: {result.totalDistance} mm</Badge>
            {material && <Badge variant="outline">{material} · {thickness} mm</Badge>}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Secuencia de Plegados</h3>
          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
            {result.bends.map((b) => (
              <div key={b.order} className="bg-card p-3 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold">
                      {b.order}
                    </Badge>
                    <span className="text-sm font-semibold">
                      Pliegue {b.order} · {b.angle}° {b.direction === 1 ? '↑' : '↓'}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    a {b.distanceFromPrevious} mm
                  </Badge>
                </div>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <Stat label="R int" v={`${b.innerRadius}`} />
                  <Stat label="K" v={`${b.kFactor}`} />
                  <Stat label="Ganancia" v={`${b.bendAllowance}`} primary />
                  <Stat label="OSSB" v={`${b.outsideSetback}`} />
                  <Stat label="Tol ±" v={`${b.tolerance}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Nombre de la pieza</Label>
          <Input placeholder="Ej: Soporte lateral A" value={pieceName}
            onChange={(e) => onPieceNameChange(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" /> Guardar pieza
            </Button>
            <Button onClick={handlePDF} variant="outline">
              <Download className="w-4 h-4 mr-1" /> PDF
            </Button>
            <Button onClick={handleDXF} variant="outline">
              <FileCode className="w-4 h-4 mr-1" /> DXF
            </Button>
            <Button onClick={handleXLSX} variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Todo se guarda y exporta localmente · 100% offline
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const Stat = ({ label, v, primary }: { label: string; v: string; primary?: boolean }) => (
  <div>
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className={`font-bold ${primary ? 'text-primary' : ''}`}>{v}</p>
  </div>
);

export default ResultsPanel;
