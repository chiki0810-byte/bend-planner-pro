import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { BendResult } from "@/pages/Index";
import { Separator } from "@/components/ui/separator";

interface ResultsPanelProps {
  result: BendResult | null;
}

const ResultsPanel = ({ result }: ResultsPanelProps) => {
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
    // Placeholder para futura funcionalidad de exportación
    alert("Funcionalidad de exportación a PDF próximamente");
  };

  const handleExportExcel = () => {
    // Placeholder para futura funcionalidad de exportación
    alert("Funcionalidad de exportación a Excel próximamente");
  };

  return (
    <Card className="shadow-lg border-accent/20">
      <CardHeader>
        <CardTitle className="text-primary">Resultados del Cálculo</CardTitle>
        <CardDescription>Parámetros calculados para todos los plegados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen total */}
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
          <div className="mt-3">
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {result.bends.length} {result.bends.length === 1 ? 'Plegado' : 'Plegados'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Detalles de cada plegado */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground">Detalle por Plegado</h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {result.bends.map((bend, index) => (
              <div key={index} className="bg-card p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Plegado {index + 1}</h4>
                  <Badge variant="outline" className="text-primary border-primary">
                    {bend.angle}°
                  </Badge>
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

        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold text-sm mb-2 text-foreground">Información Técnica</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• La ganancia de plegado incluye el material absorbido en el doblez</li>
            <li>• El radio recomendado previene agrietamiento del material</li>
            <li>• El factor K representa la posición del eje neutro</li>
            <li>• La longitud desarrollada total suma todas las ganancias</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="flex-1"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsPanel;
