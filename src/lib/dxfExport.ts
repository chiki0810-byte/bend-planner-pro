import { BendResult } from '@/pages/Index';

/**
 * Genera un DXF mínimo (R12 ASCII) con:
 *  - Capa CUT: rectángulo del desarrollo (líneas de corte)
 *  - Capa BEND_UP / BEND_DOWN: líneas de plegado (verticales discontinuas)
 * Compatible con la mayoría de software CAM/CNC.
 */
export function exportBendDxf(opts: {
  result: BendResult;
  pieceName?: string;
  width?: number; // ancho de la chapa en mm (perpendicular al desarrollo). Default 100.
}) {
  const { result, pieceName, width = 100 } = opts;
  const total = result.totalDevelopedLength || result.pieceLength;
  const W = total;
  const H = width;

  const lines: string[] = [];
  const push = (code: string | number, val: string | number) => {
    lines.push(String(code));
    lines.push(String(val));
  };

  // Header mínimo
  push(0, 'SECTION');
  push(2, 'HEADER');
  push(0, 'ENDSEC');

  // Tables (capas)
  push(0, 'SECTION');
  push(2, 'TABLES');
  push(0, 'TABLE');
  push(2, 'LAYER');
  push(70, 3);
  // CUT layer
  push(0, 'LAYER'); push(2, 'CUT'); push(70, 0); push(62, 7); push(6, 'CONTINUOUS');
  // BEND_UP
  push(0, 'LAYER'); push(2, 'BEND_UP'); push(70, 0); push(62, 5); push(6, 'DASHED');
  // BEND_DOWN
  push(0, 'LAYER'); push(2, 'BEND_DOWN'); push(70, 0); push(62, 1); push(6, 'DASHED');
  push(0, 'ENDTAB');
  push(0, 'ENDSEC');

  // Entities
  push(0, 'SECTION');
  push(2, 'ENTITIES');

  const line = (x1: number, y1: number, x2: number, y2: number, layer: string) => {
    push(0, 'LINE'); push(8, layer);
    push(10, x1); push(20, y1); push(30, 0);
    push(11, x2); push(21, y2); push(31, 0);
  };

  // Rectángulo de corte
  line(0, 0, W, 0, 'CUT');
  line(W, 0, W, H, 'CUT');
  line(W, H, 0, H, 'CUT');
  line(0, H, 0, 0, 'CUT');

  // Líneas de plegado
  let acc = 0;
  for (const b of result.bends) {
    acc += b.distanceFromPrevious;
    line(acc, 0, acc, H, b.direction === 1 ? 'BEND_UP' : 'BEND_DOWN');
  }

  push(0, 'ENDSEC');
  push(0, 'EOF');

  const dxf = lines.join('\n');
  const blob = new Blob([dxf], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plegado_${(pieceName || 'pieza').replace(/\s+/g, '_')}_${Date.now()}.dxf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
