import * as XLSX from 'xlsx';
import { BendResult } from '@/pages/Index';

export function exportBendXlsx(opts: {
  result: BendResult;
  material: string;
  thickness: number;
  pieceName?: string;
}) {
  const { result, material, thickness, pieceName } = opts;

  const summary = [
    ['Cálculo de Plegado'],
    [],
    ['Pieza', pieceName || 'Sin nombre'],
    ['Material', material],
    ['Espesor (mm)', thickness],
    ['Longitud de pieza (mm)', result.pieceLength],
    ['Longitud desarrollada (mm)', result.totalDevelopedLength],
    ['Distancia acumulada (mm)', result.totalDistance],
    ['Fecha', new Date().toLocaleString()],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summary);

  const header = ['#', 'Distancia (mm)', 'Ángulo (°)', 'Sentido', 'R interior (mm)', 'Factor K',
                  'Ganancia (mm)', 'OSSB (mm)', 'Deducción (mm)', 'Tolerancia ± (mm)'];
  const rows = result.bends.map(b => [
    b.order, b.distanceFromPrevious, b.angle,
    b.direction === 1 ? '+' : '-',
    b.innerRadius, b.kFactor,
    b.bendAllowance, b.outsideSetback, b.bendDeduction, b.tolerance,
  ]);
  const wsBends = XLSX.utils.aoa_to_sheet([header, ...rows]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
  XLSX.utils.book_append_sheet(wb, wsBends, 'Plegados');

  const fname = `plegado_${(pieceName || 'pieza').replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fname);
}
