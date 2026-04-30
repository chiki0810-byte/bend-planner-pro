import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRemates } from "@/state/RematesContext";
import { ArrowLeft, FileSpreadsheet, FileDown, Trash2 } from "lucide-react";
import { exportRemateExcel, exportRematePdf, itemToExportData } from "@/lib/rematesExport";
import logoEmpresa from "@/assets/logo_empresa.png";
import { toast } from "sonner";

const Row = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-center justify-between p-2 rounded bg-muted/40 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono font-medium">{value}</span>
  </div>
);

const DetalleRematePage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { get, remove } = useRemates();
  const it = get(id);

  if (!it) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-muted-foreground">Remate no encontrado.</p>
          <Link to="/historial-remates" className="text-sky-400 underline">Volver al historial</Link>
        </div>
      </div>
    );
  }

  const data = itemToExportData(it);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => { remove(it.id); toast.success("Eliminado"); navigate("/historial-remates"); }}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Eliminar
          </Button>
        </div>

        <header>
          <h1 className="text-2xl font-bold">Detalle Remate</h1>
          <p className="text-sm text-muted-foreground">
            {it.fecha} · <span className="uppercase">{it.tipo}</span>
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-5">
          <Card className="border-sky-500/20">
            <CardHeader><CardTitle className="text-base">Medidas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Row label="Material" value={it.material} />
              <Row label="Espesor" value={`${it.espesor} mm`} />
              <Row label="Solape" value={`${it.solape} mm`} />
              <Row label="Medida derecha" value={`${it.derecha} mm`} />
              <Row label="Medida izquierda" value={`${it.izquierda} mm`} />
              <Row label="Punta grande" value={`${it.puntaA} mm`} />
              <Row label="Punta pequeña" value={`${it.puntaB} mm`} />
              <Row label="Altura" value={`${it.altura} mm`} />
            </CardContent>
          </Card>

          <Card className="border-sky-500/20">
            <CardHeader><CardTitle className="text-base">Desarrollos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Row label="Derecha" value={`${it.desarrollo_derecha.toFixed(2)} mm`} />
              <Row label="Izquierda" value={`${it.desarrollo_izquierda.toFixed(2)} mm`} />
              <Row label="Punta grande" value={`${it.desarrollo_puntaA.toFixed(2)} mm`} />
              <Row label="Punta pequeña" value={`${it.desarrollo_puntaB.toFixed(2)} mm`} />
              <div className="flex items-baseline justify-between p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 mt-3">
                <span className="text-sm font-semibold text-sky-200">TOTAL</span>
                <span className="text-xl font-bold text-sky-300 tabular-nums">
                  {it.desarrollo_total.toFixed(2)} <span className="text-xs font-normal">mm</span>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {it.foto && (
          <Card className="border-sky-500/20">
            <CardHeader><CardTitle className="text-base">Foto del plano</CardTitle></CardHeader>
            <CardContent>
              <img src={it.foto} alt="Plano" className="w-full max-h-96 object-contain rounded-md bg-black/40" />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="border-sky-500/40 text-sky-200 hover:bg-sky-500/10"
            onClick={() => { exportRemateExcel(data); toast.success("Excel exportado"); }}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar a Excel
          </Button>
          <Button
            variant="outline"
            className="border-sky-500/40 text-sky-200 hover:bg-sky-500/10"
            onClick={async () => { await exportRematePdf(data, logoEmpresa); toast.success("PDF exportado"); }}
          >
            <FileDown className="w-4 h-4 mr-2" /> Exportar a PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DetalleRematePage;
