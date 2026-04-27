import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BendResult } from '@/pages/Index';

export function exportBendPdf(opts: {
  result: BendResult;
  material: string;
  thickness: number;
  pieceName?: string;
}) {
  const { result, material, thickness, pieceName } = opts;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Cálculo de Plegado', 14, 18);

  doc.setFontSize(11);
  doc.text(`Pieza: ${pieceName || 'Sin nombre'}`, 14, 28);
  doc.text(`Material: ${material}`, 14, 34);
  doc.text(`Espesor: ${thickness} mm`, 14, 40);
  doc.text(`Longitud de pieza: ${result.pieceLength} mm`, 14, 46);
  doc.text(`Longitud desarrollada total: ${result.totalDevelopedLength} mm`, 14, 52);
  doc.text(`Distancia total acumulada: ${result.totalDistance} mm`, 14, 58);
  doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 64);

  autoTable(doc, {
    startY: 72,
    head: [['#', 'Distancia (mm)', 'Ángulo (°)', 'Ganancia (mm)', 'Radio (mm)', 'Factor K']],
    body: result.bends.map((b) => [
      b.order,
      b.distanceFromPrevious,
      b.angle,
      b.bendAllowance,
      b.recommendedRadius,
      b.kFactor,
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 64, 175] },
  });

  const fname = `plegado_${(pieceName || 'pieza').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(fname);
}
