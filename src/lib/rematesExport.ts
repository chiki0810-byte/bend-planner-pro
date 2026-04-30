import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { RemateHistorialItem } from "@/state/RematesContext";

export interface RemateExportData {
  tipo: "recto" | "conico";
  material: string;
  espesor: number;
  solape: number;
  medidaDerecha: number;
  medidaIzquierda: number;
  puntaGrande: number;
  puntaPequena: number;
  altura: number;
  desarrollo_derecha: number;
  desarrollo_izquierda: number;
  desarrollo_puntaA: number;
  desarrollo_puntaB: number;
  desarrollo_total: number;
  foto?: string | null;
  fecha?: string;
}

export const exportRemateExcel = (d: RemateExportData) => {
  const fila = {
    "Fecha": d.fecha ?? new Date().toLocaleString(),
    "Tipo de remate": d.tipo,
    "Medida derecha (mm)": d.medidaDerecha,
    "Medida izquierda (mm)": d.medidaIzquierda,
    "Punta grande (mm)": d.puntaGrande,
    "Punta pequeña (mm)": d.puntaPequena,
    "Altura (mm)": d.altura,
    "Espesor (mm)": d.espesor,
    "Material": d.material,
    "Solape (mm)": d.solape,
    "Desarrollo derecha (mm)": Number(d.desarrollo_derecha.toFixed(2)),
    "Desarrollo izquierda (mm)": Number(d.desarrollo_izquierda.toFixed(2)),
    "Desarrollo punta grande (mm)": Number(d.desarrollo_puntaA.toFixed(2)),
    "Desarrollo punta pequeña (mm)": Number(d.desarrollo_puntaB.toFixed(2)),
    "Desarrollo total (mm)": Number(d.desarrollo_total.toFixed(2)),
  };
  const ws = XLSX.utils.json_to_sheet([fila]);
  ws["!cols"] = Object.keys(fila).map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Remate");
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  XLSX.writeFile(wb, `remate_${d.tipo}_${ts}.xlsx`);
};

export const exportRematePdf = async (d: RemateExportData, logoUrl?: string) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  let y = 14;

  // Logo (opcional)
  if (logoUrl) {
    try {
      const dataUrl = await urlToDataUrl(logoUrl);
      doc.addImage(dataUrl, "PNG", 14, y, 28, 28);
    } catch {}
  }

  doc.setFontSize(18);
  doc.text("Remate - Desarrollo", pageW / 2, y + 10, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Fecha: ${d.fecha ?? new Date().toLocaleString()}`, pageW - 14, y + 6, { align: "right" });
  doc.text(`Tipo: ${d.tipo.toUpperCase()}`, pageW - 14, y + 12, { align: "right" });

  y += 36;

  autoTable(doc, {
    startY: y,
    head: [["Parámetro", "Valor"]],
    body: [
      ["Material", d.material],
      ["Espesor (mm)", String(d.espesor)],
      ["Solape (mm)", String(d.solape)],
      ["Medida derecha (mm)", String(d.medidaDerecha)],
      ["Medida izquierda (mm)", String(d.medidaIzquierda)],
      ["Punta grande (mm)", String(d.puntaGrande)],
      ["Punta pequeña (mm)", String(d.puntaPequena)],
      ["Altura (mm)", String(d.altura)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [14, 116, 144] },
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 6;

  autoTable(doc, {
    startY: y,
    head: [["Desarrollo", "mm"]],
    body: [
      ["Derecha", d.desarrollo_derecha.toFixed(2)],
      ["Izquierda", d.desarrollo_izquierda.toFixed(2)],
      ["Punta grande", d.desarrollo_puntaA.toFixed(2)],
      ["Punta pequeña", d.desarrollo_puntaB.toFixed(2)],
      ["TOTAL", d.desarrollo_total.toFixed(2)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [2, 132, 199] },
  });

  // @ts-ignore
  y = (doc as any).lastAutoTable.finalY + 8;

  if (d.foto) {
    try {
      doc.setFontSize(11);
      doc.text("Foto del plano:", 14, y);
      const props = (doc as any).getImageProperties(d.foto);
      const maxW = pageW - 28;
      const maxH = 110;
      const ratio = Math.min(maxW / props.width, maxH / props.height);
      const w = props.width * ratio;
      const h = props.height * ratio;
      doc.addImage(d.foto, "JPEG", 14, y + 4, w, h);
    } catch {}
  }

  const fechaSafe = (d.fecha ?? new Date().toLocaleString()).replace(/[^\w]/g, "-");
  doc.save(`remate_${d.tipo}_${fechaSafe}.pdf`);
};

const urlToDataUrl = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });

export const itemToExportData = (it: RemateHistorialItem): RemateExportData => ({
  tipo: it.tipo,
  material: it.material,
  espesor: it.espesor,
  solape: it.solape,
  medidaDerecha: it.derecha,
  medidaIzquierda: it.izquierda,
  puntaGrande: it.puntaA,
  puntaPequena: it.puntaB,
  altura: it.altura,
  desarrollo_derecha: it.desarrollo_derecha,
  desarrollo_izquierda: it.desarrollo_izquierda,
  desarrollo_puntaA: it.desarrollo_puntaA,
  desarrollo_puntaB: it.desarrollo_puntaB,
  desarrollo_total: it.desarrollo_total,
  foto: it.foto,
  fecha: it.fecha,
});
