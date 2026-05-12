import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";

type Orientacion = "up" | "down";
type CaraVista = "up" | "down";

interface PliegueIn {
  longitud: number;
  angulo: number;
  cierra: boolean;
  orientacion: Orientacion;
}
interface PliegueCalcIn {
  ba: number;
  comp: number;
  desarrollo: number;
  anguloMaquina: number;
}

interface ResultadoState {
  pliegues?: { punta: "A" | "B"; pliegue: PliegueIn; calc: PliegueCalcIn }[];
  desarrolloPuntaA?: number;
  desarrolloPuntaB?: number;
  desarrolloTotal?: number;
  nombrePieza?: string;
}

const ResultadoPiezaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as ResultadoState;

  const [nombre, setNombre] = useState(state.nombrePieza || "");
  const [cliente, setCliente] = useState("");
  const [obra, setObra] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [firmaSello, setFirmaSello] = useState("");
  const [caraVista, setCaraVista] = useState<CaraVista>("up");

  const pliegues = state.pliegues || [];
  const desA = state.desarrolloPuntaA ?? 0;
  const desB = state.desarrolloPuntaB ?? 0;
  const desTotal = state.desarrolloTotal ?? desA + desB;

  // Esquema lineal simple: dibuja segmentos con cambio de dirección por orientación
  const esquema = useMemo(() => {
    const w = 600;
    const h = 180;
    if (pliegues.length === 0) return { w, h, points: "" as string };
    const totalLen = pliegues.reduce((s, p) => s + (p.pliegue.longitud || 0), 0) || 1;
    const scale = (w - 40) / totalLen;
    let x = 20;
    let y = h / 2;
    let dir: 1 | -1 = 1;
    const pts: string[] = [`${x},${y}`];
    pliegues.forEach((p) => {
      const len = (p.pliegue.longitud || 0) * scale;
      x += len;
      // alterna vertical en función de orientación
      const dy = (p.pliegue.orientacion === "up" ? -1 : 1) * 28 * dir;
      y += dy;
      pts.push(`${x},${y}`);
      dir = (dir * -1) as 1 | -1;
    });
    return { w, h, points: pts.join(" ") };
  }, [pliegues]);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Resultado de Pieza</h1>
            <p className="text-sm text-muted-foreground">Vista industrial estilo plano de taller</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
      </header>

      {/* Identificación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificación</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nombre de la pieza</Label>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Remate frontal" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <ResultBox label="Punta A" value={desA} />
            <ResultBox label="Punta B" value={desB} />
            <ResultBox label={`D:${desTotal.toFixed(0)}`} value={desTotal} highlight />
          </div>
        </CardContent>
      </Card>

      {/* Lista de pliegues */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de Pliegues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pliegues.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Sin pliegues. Vuelve a “Pliegues por Punta” y pulsa “Ver Resultado”.
            </p>
          )}
          {pliegues.map((p, i) => {
            const arrow = p.pliegue.orientacion === "up" ? "↑" : "↓";
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-muted/30 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{p.punta}</Badge>
                  <span className="font-semibold">Pliegue {i + 1}</span>
                </div>
                <div className="text-right tabular-nums text-xs sm:text-sm">
                  <div>
                    {p.pliegue.angulo}° {arrow} a {p.pliegue.longitud} mm · Áng. máquina{" "}
                    <span className="font-semibold">{p.calc.anguloMaquina.toFixed(0)}°</span>
                  </div>
                  <div className="text-muted-foreground">
                    Desarrollo {p.calc.desarrollo.toFixed(2)} mm
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Cara vista */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cara Vista (Color)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex gap-2">
            <Toggle
              pressed={caraVista === "up"}
              onPressedChange={() => setCaraVista("up")}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <ArrowUp className="w-4 h-4 mr-1" /> Color hacia arriba
            </Toggle>
            <Toggle
              pressed={caraVista === "down"}
              onPressedChange={() => setCaraVista("down")}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <ArrowDown className="w-4 h-4 mr-1" /> Color hacia abajo
            </Toggle>
          </div>
          <div className="flex-1 flex justify-center">
            {caraVista === "up" ? (
              <ArrowUp className="w-24 h-24 text-primary" strokeWidth={2.5} />
            ) : (
              <ArrowDown className="w-24 h-24 text-primary" strokeWidth={2.5} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Esquema lineal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Esquema del Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${esquema.w} ${esquema.h}`}
              className="w-full h-44 bg-muted/20 rounded-lg border"
            >
              {esquema.points && (
                <polyline
                  points={esquema.points}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 text-center">
            Esquema orientativo · medidas en la lista superior
          </p>
        </CardContent>
      </Card>

      {/* Datos cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Input value={cliente} onChange={(e) => setCliente(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Obra</Label>
            <Input value={obra} onChange={(e) => setObra(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Observaciones</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Firma y sello (texto)</Label>
            <Input
              value={firmaSello}
              onChange={(e) => setFirmaSello(e.target.value)}
              placeholder="Nombre / sello"
            />
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </Button>
        <Button disabled>
          Continuar <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

const ResultBox = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) => (
  <div
    className={`p-3 rounded-lg border ${
      highlight ? "border-primary bg-primary/10" : "border-border bg-muted/30"
    }`}
  >
    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`text-lg font-bold tabular-nums ${highlight ? "text-primary" : ""}`}>
      {value.toFixed(2)}
      <span className="text-xs font-normal"> mm</span>
    </div>
  </div>
);

export default ResultadoPiezaPage;
