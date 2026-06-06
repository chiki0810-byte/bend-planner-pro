import { Layers3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SheetSVG, { defaultSheetState } from "@/components/SheetSVG";

const ChapaSVGPage = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <header className="flex items-center gap-3">
        <Layers3 className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Chapa SVG</h1>
          <p className="text-sm text-muted-foreground">
            Lienzo por capas: base · zonas · cortes · pliegues · cotas
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lienzo</CardTitle>
        </CardHeader>
        <CardContent>
          <SheetSVG state={defaultSheetState} />
          <p className="text-[11px] text-muted-foreground mt-2">
            Módulos 1–3 listos. Envía los siguientes módulos para añadir
            renderizado de pliegues, cortes y cotas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChapaSVGPage;
