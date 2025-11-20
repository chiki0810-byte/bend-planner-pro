import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { BendResult } from "@/pages/Index";

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
        <CardDescription>Parámetros calculados para el plegado</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Ganancia de Plegado</p>
            <p className="text-3xl font-bold text-primary">{result.bendAllowance}</p>
            <p className="text-xs text-muted-foreground mt-1">mm</p>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Longitud Desarrollada</p>
            <p className="text-3xl font-bold text-technical">{result.developedLength}</p>
            <p className="text-xs text-muted-foreground mt-1">mm</p>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Radio Recomendado</p>
            <p className="text-3xl font-bold text-primary">{result.recommendedRadius}</p>
            <p className="text-xs text-muted-foreground mt-1">mm</p>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-1">Factor K</p>
            <p className="text-3xl font-bold text-technical">{result.kFactor}</p>
            <Badge variant="secondary" className="mt-2">
              Precisión estándar
            </Badge>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold text-sm mb-2 text-foreground">Información Técnica</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• La ganancia de plegado incluye el material absorbido en el doblez</li>
            <li>• El radio recomendado previene agrietamiento del material</li>
            <li>• El factor K representa la posición del eje neutro</li>
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
