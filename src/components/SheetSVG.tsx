import { useMemo } from "react";
import { buildCutPathD, defaultSheetState, type Cut, type CutPath, type SheetState } from "@/lib/sheetSvgModel";

const isCutPath = (c: Cut): c is CutPath => "points" in c;

interface SheetSVGProps {
  state?: SheetState;
}

const SheetSVG = ({ state = defaultSheetState }: SheetSVGProps) => {
  const { base, bendZones, cuts, folds, dims } = state;

  const folded = useMemo(() => folds, [folds]);

  return (
    <div className="w-full overflow-auto">
      <svg
        id="sheet"
        width="100%"
        height="auto"
        viewBox={`0 0 ${base.W} ${base.H}`}
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-lg border bg-muted/20"
      >
        {/* MÓDULO 7 — HATCH INDUSTRIAL SVG */}
        <defs>
          <pattern
            id="hatch"
            patternUnits="userSpaceOnUse"
            width={8}
            height={8}
            patternTransform="rotate(45)"
          >
            <line x1={0} y1={0} x2={0} y2={8} stroke="#ff3a5c" strokeWidth={1} />
          </pattern>
        </defs>
        {/* CAPA BASE */}
        <g id="layer-base">
          <rect
            x={0}
            y={0}
            width={base.W}
            height={base.H}
            fill="hsl(var(--background))"
            stroke="hsl(var(--foreground))"
            strokeWidth={base.stroke}
          />
        </g>

        {/* CAPA ZONAS DE DOBLADO */}
        <g id="layer-bend-zones">
          {bendZones.map((z) => (
            <rect
              key={z.id}
              x={z.x}
              y={0}
              width={z.width}
              height={base.H}
              fill={z.color ?? "hsl(var(--primary) / 0.12)"}
            />
          ))}
        </g>

        {/* CAPA CORTES */}
        <g id="layer-cuts">
          {cuts.map((c) =>
            isCutPath(c) ? (
              <path
                key={c.id}
                d={buildCutPathD(c.points)}
                fill="url(#hatch)"
                stroke="hsl(var(--destructive))"
                strokeWidth={1}
              />
            ) : (
              <rect
                key={c.id}
                x={c.x}
                y={c.y}
                width={c.w}
                height={c.h}
                fill="url(#hatch)"
                stroke="hsl(var(--destructive))"
                strokeWidth={1}
              />
            ),
          )}
        </g>

        {/* CAPA PLIEGUES */}
        <g id="layer-folds">
          {folded.map((f) => (
            <g key={f.id}>
              <line
                x1={f.x}
                y1={0}
                x2={f.x}
                y2={base.H}
                stroke="hsl(var(--primary))"
                strokeWidth={1.2}
                strokeDasharray="4 3"
              />
              <text
                x={f.x}
                y={12}
                textAnchor="middle"
                fontSize={10}
                fill="hsl(var(--primary))"
              >
                {f.angle}°
              </text>
            </g>
          ))}
        </g>

        {/* CAPA COTAS */}
        <g id="layer-dims">
          {dims.map((d) => (
            <g key={d.id}>
              <line
                x1={d.x1}
                y1={d.y1}
                x2={d.x2}
                y2={d.y2}
                stroke="hsl(var(--foreground))"
                strokeWidth={0.8}
              />
              <text
                x={(d.x1 + d.x2) / 2}
                y={(d.y1 + d.y2) / 2 - 4}
                textAnchor="middle"
                fontSize={10}
                fill="hsl(var(--foreground))"
              >
                {d.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};

export default SheetSVG;
