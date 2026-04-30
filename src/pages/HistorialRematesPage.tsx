import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useRemates } from "@/state/RematesContext";
import { History, ChevronRight, Scissors } from "lucide-react";

const HistorialRematesPage = () => {
  const { historial } = useRemates();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30">
            <History className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Historial Remates</h1>
            <p className="text-sm text-muted-foreground">
              {historial.length} registro{historial.length === 1 ? "" : "s"}
            </p>
          </div>
        </header>

        {historial.length === 0 ? (
          <Card className="border-sky-500/20">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Scissors className="w-10 h-10 mx-auto mb-3 opacity-40" />
              Todavía no hay remates calculados.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {historial.map((it) => (
              <Link
                key={it.id}
                to={`/historial-remates/${it.id}`}
                className="block p-4 rounded-lg border border-sky-500/20 bg-card hover:bg-sky-500/5 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 uppercase tracking-wider">
                        {it.tipo}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">{it.fecha}</span>
                    </div>
                    <div className="mt-1 text-base font-semibold text-sky-200 tabular-nums">
                      {it.desarrollo_total.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">mm desarrollo total</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-sky-400/60 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialRematesPage;
