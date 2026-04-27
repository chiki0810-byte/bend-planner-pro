import { BendResult } from "@/pages/Index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ruler } from "lucide-react";

interface DevelopedView2DProps {
  result: BendResult | null;
  pieceLength: number;
}

/**
 * Vista 2D del desarrollo: dibuja la chapa estirada con marcas de cada
 * pliegue, cotas (distancias acumuladas), número de orden y dirección (+/-).
 */
const DevelopedView2D = ({ result, pieceLength }: DevelopedView2DProps) => {
  if (!result) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ruler className="w-5 h-5 text-primary" />
            Vista 2D del Desarrollo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Calcula una pieza para ver su desarrollo
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = result.totalDevelopedLength || pieceLength;
  const W = 800;
  const H = 220;
  const margin = 60;
  const stripeH = 60;
  const stripeY = 90;
  const scale = (W - 2 * margin) / total;

  // Posiciones acumuladas de los pliegues (sumando distancia desde anterior)
  let acc = 0;
  const marks = result.bends.map((b) => {
    acc += b.distanceFromPrevious;
    return { x: margin + acc * scale, ...b, position: acc };
  });

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ruler className="w-5 h-5 text-primary" />
          Vista 2D del Desarrollo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-muted/20 rounded border">
            {/* Chapa */}
            <rect x={margin} y={stripeY} width={W - 2 * margin} height={stripeH}
              fill="hsl(var(--muted))" stroke="hsl(var(--primary))" strokeWidth="2" />

            {/* Cota total */}
            <line x1={margin} y1={stripeY + stripeH + 30} x2={W - margin} y2={stripeY + stripeH + 30}
              stroke="hsl(var(--foreground))" strokeWidth="1" />
            <line x1={margin} y1={stripeY + stripeH + 25} x2={margin} y2={stripeY + stripeH + 35}
              stroke="hsl(var(--foreground))" />
            <line x1={W - margin} y1={stripeY + stripeH + 25} x2={W - margin} y2={stripeY + stripeH + 35}
              stroke="hsl(var(--foreground))" />
            <text x={W / 2} y={stripeY + stripeH + 50} textAnchor="middle"
              fontSize="13" fill="hsl(var(--foreground))" fontWeight="bold">
              Desarrollo total: {total.toFixed(2)} mm
            </text>

            {/* Marcas de pliegues */}
            {marks.map((m, i) => (
              <g key={i}>
                {/* Línea de pliegue */}
                <line x1={m.x} y1={stripeY - 10} x2={m.x} y2={stripeY + stripeH + 10}
                  stroke={m.direction === 1 ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                  strokeWidth="2" strokeDasharray="4 3" />
                {/* Círculo de número */}
                <circle cx={m.x} cy={stripeY - 25} r="14" fill="hsl(var(--primary))" />
                <text x={m.x} y={stripeY - 21} textAnchor="middle"
                  fontSize="13" fontWeight="bold" fill="hsl(var(--primary-foreground))">
                  {m.order}
                </text>
                {/* Ángulo y dirección */}
                <text x={m.x} y={stripeY + stripeH + 15} textAnchor="middle"
                  fontSize="11" fill="hsl(var(--foreground))">
                  {m.angle}° {m.direction === 1 ? '↑' : '↓'}
                </text>
                {/* Cota acumulada */}
                <text x={m.x} y={stripeY - 45} textAnchor="middle"
                  fontSize="10" fill="hsl(var(--muted-foreground))">
                  {m.position.toFixed(1)} mm
                </text>
              </g>
            ))}

            {/* Etiquetas de extremos */}
            <text x={margin} y={stripeY - 5} fontSize="10" fill="hsl(var(--muted-foreground))">
              Borde A
            </text>
            <text x={W - margin} y={stripeY - 5} textAnchor="end"
              fontSize="10" fill="hsl(var(--muted-foreground))">
              Borde B
            </text>
          </svg>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-primary" /> Plegado +
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-destructive" /> Plegado −
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DevelopedView2D;
