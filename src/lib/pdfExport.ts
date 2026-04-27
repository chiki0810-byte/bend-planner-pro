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

  doc.setFontSize(10);
  doc.text(`Pieza: ${pieceName || 'Sin nombre'}`, 14, 28);
  doc.text(`Material: ${material}`, 14, 34);
  doc.text(`Espesor: ${thickness} mm`, 14, 40);
  doc.text(`Longitud de pieza: ${result.pieceLength} mm`, 14, 46);
  doc.text(`Longitud desarrollada total: ${result.totalDevelopedLength} mm`, 14, 52);
  doc.text(`Distancia total acumulada: ${result.totalDistance} mm`, 14, 58);
  doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 64);

  autoTable(doc, {
    startY: 72,
    head: [['#', 'Dist (mm)', 'Áng (°)', 'Sent.', 'R int', 'K', 'Ganancia', 'OSSB', 'Deducc.', 'Tol ±']],
    body: result.bends.map((b) => [
      b.order,
      b.distanceFromPrevious,
      b.angle,
      b.direction === 1 ? '+' : '−',
      b.innerRadius,
      b.kFactor,
      b.bendAllowance,
      b.outsideSetback,
      b.bendDeduction,
      b.tolerance,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 175] },
  });

  // Vista 2D simplificada
  // @ts-ignore
  const yAfter = (doc as any).lastAutoTable.finalY + 10;
  if (yAfter < 240) {
    doc.setFontSize(11);
    doc.text('Vista 2D del desarrollo', 14, yAfter);
    const x0 = 20, y0 = yAfter + 10, w = 170, h = 14;
    doc.setDrawColor(30, 64, 175);
    doc.rect(x0, y0, w, h);
    let acc = 0;
    const total = result.totalDevelopedLength || result.pieceLength;
    result.bends.forEach((b) => {
      acc += b.distanceFromPrevious;
      const px = x0 + (acc / total) * w;
      doc.setDrawColor(b.direction === 1 ? 30 : 200, b.direction === 1 ? 64 : 30, b.direction === 1 ? 175 : 30);
      doc.line(px, y0 - 3, px, y0 + h + 3);
      doc.setFontSize(7);
      doc.text(String(b.order), px - 1, y0 - 4);
      doc.text(`${b.angle}°`, px - 3, y0 + h + 7);
    });
  }

  const fname = `plegado_${(pieceName || 'pieza').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(fname);
}
