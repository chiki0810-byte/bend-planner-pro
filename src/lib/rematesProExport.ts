import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PliegueExp {
  longitud_mm: number;
  angulo_deg: number;
  radio_mm: number;
}

export interface RemateProExportData {
  tipo: "recto_simetrico" | "recto_asimetrico" | "conico_enchufable";
  material: string;
  espesor: number;
  solape: number;
  pliegues_base?: PliegueExp[];
  pliegues_puntaA?: PliegueExp[];
  pliegues_puntaB?: PliegueExp[];
  desarrollo_puntaA: number;
  desarrollo_puntaB: number;
  desarrollo_total: number;
  foto?: string | null;
  fecha?: string;
}

const TIPO_LABEL: Record<RemateProExportData["tipo"], string> = {
  recto_simetrico: "Recto simétrico",
  recto_asimetrico: "Recto asimétrico",
  conico_enchufable: "Cónico enchufable",
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

const pliegueRows = (lista?: PliegueExp[]) =>
  (lista ?? []).map((p, i) => [
    String(i + 1),
    String(p.longitud_mm ?? 0),
    String(p.angulo_deg ?? 0),
    String(p.radio_mm ?? 0),
  ]);

export const exportRemateProPdf = async (
  d: RemateProExportData,
  logoUrl?: string,
) => {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const fecha = d.fecha ?? new Date().toLocaleString();
  let y = 14;

  if (logoUrl) {
    try {
      const dataUrl = await urlToDataUrl(logoUrl);
      doc.addImage(dataUrl, "PNG", 14, y, 26, 26);
    } catch {}
  }

  doc.setFontSize(17);
  doc.text("Remate profesional", pageW / 2, y + 9, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Fecha: ${fecha}`, pageW - 14, y + 6, { align: "right" });
  doc.text(`Tipo: ${TIPO_LABEL[d.tipo]}`, pageW - 14, y + 12, { align: "right" });

  y += 32;

  autoTable(doc, {
    startY: y,
    head: [["Parámetro", "Valor"]],
    body: [
      ["Material", d.material],
      ["Espesor (mm)", String(d.espesor)],
      ["Solape aplicado (mm)", String(d.solape)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [14, 116, 144] },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  const renderPliegues = (titulo: string, lista?: PliegueExp[]) => {
    if (!lista || lista.length === 0) return;
    doc.setFontSize(11);
    doc.text(titulo, 14, y);
    y += 2;
    autoTable(doc, {
      startY: y + 2,
      head: [["#", "Longitud (mm)", "Ángulo (°)", "Radio (mm)"]],
      body: pliegueRows(lista),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [2, 132, 199] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  };

  if (d.tipo === "recto_simetrico") {
    renderPliegues("Pliegues base (ambas puntas)", d.pliegues_base);
  } else {
    renderPliegues(
      d.tipo === "conico_enchufable" ? "Pliegues punta A (grande)" : "Pliegues punta A",
      d.pliegues_puntaA,
    );
    renderPliegues(
      d.tipo === "conico_enchufable" ? "Pliegues punta B (pequeña)" : "Pliegues punta B",
      d.pliegues_puntaB,
    );
  }

  autoTable(doc, {
    startY: y,
    head: [["Desarrollo", "mm"]],
    body: [
      ["Punta A", d.desarrollo_puntaA.toFixed(2)],
      ["Punta B", d.desarrollo_puntaB.toFixed(2)],
      ["TOTAL (con solape)", d.desarrollo_total.toFixed(2)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [2, 132, 199] },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  if (d.foto) {
    try {
      if (y > pageH - 70) { doc.addPage(); y = 14; }
      doc.setFontSize(11);
      doc.text("Foto del plano:", 14, y);
      const props = (doc as any).getImageProperties(d.foto);
      const maxW = pageW - 28;
      const maxH = pageH - y - 20;
      const ratio = Math.min(maxW / props.width, maxH / props.height);
      const w = props.width * ratio;
      const h = props.height * ratio;
      doc.addImage(d.foto, "JPEG", 14, y + 4, w, h);
    } catch {}
  }

  const fechaSafe = fecha.replace(/[^\w]/g, "-");
  doc.save(`remate_profesional_${d.tipo}_${fechaSafe}.pdf`);
};
