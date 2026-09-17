import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import coverHeader from "@/assets/tupiniquim-report-cover.png";
import { downloadBlob } from "@/lib/docx-download";

type Priority = {
  titulo: string;
  porQueImporta: string;
  acao: string;
};

type BusinessSummary = {
  resumo: string;
  contexto: string;
  impactoNegocio: string[];
  prioridades: Priority[];
  proximoPasso: string;
};

const GREEN = "008F4C";
const DARK = "333333";
const MUTED = "666666";

async function loadCoverHeader(): Promise<ArrayBuffer> {
  const response = await fetch(coverHeader);
  if (!response.ok) throw new Error("Não foi possível carregar o cabeçalho do relatório.");
  return response.arrayBuffer();
}

function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 280, after: 180 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: GREEN,
        size: 28,
        font: "Bree Serif",
      }),
    ],
  });
}

function body(text: string): Paragraph {
  return new Paragraph({
    text,
    spacing: { after: 180, line: 320 },
    children: [new TextRun({ text, color: DARK, size: 23, font: "Arial" })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 130, line: 300 },
    children: [new TextRun({ text, color: DARK, size: 22, font: "Arial" })],
  });
}

export async function downloadBusinessReport(
  url: string,
  summary: BusinessSummary,
): Promise<void> {
  const hostname = new URL(url).hostname.replace(/^www\./i, "").toUpperCase();
  const header = await loadCoverHeader();
  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 260 },
      children: [
        new ImageRun({
          type: "png",
          data: header,
          transformation: { width: 600, height: 96 },
          altText: {
            title: "Cabeçalho Tupiniquim",
            description: "Cabeçalho do relatório",
            name: "header",
          },
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 200, after: 420 },
      children: [
        new TextRun({
          text: `${hostname} - RELATÓRIO EXECUTIVO`,
          font: "Bree Serif",
          size: 32,
          color: GREEN,
        }),
      ],
    }),
    sectionTitle("Visão geral"),
    body(summary.resumo),
    sectionTitle("O que isso significa para o negócio"),
    body(summary.contexto),
    ...summary.impactoNegocio.map(bullet),
    new Paragraph({ children: [], pageBreakBefore: true }),
    sectionTitle("Prioridades recomendadas"),
  ];

  summary.prioridades.forEach((priority, index) => {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 100 },
        children: [
          new TextRun({
            text: `${index + 1}. ${priority.titulo}`,
            bold: true,
            color: GREEN,
            size: 25,
            font: "Arial",
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 90 },
        children: [
          new TextRun({
            text: "Por que importa: ",
            bold: true,
            color: DARK,
            size: 22,
            font: "Arial",
          }),
          new TextRun({ text: priority.porQueImporta, color: DARK, size: 22, font: "Arial" }),
        ],
      }),
      new Paragraph({
        spacing: { after: 180, line: 300 },
        children: [
          new TextRun({
            text: "O que fazer: ",
            bold: true,
            color: DARK,
            size: 22,
            font: "Arial",
          }),
          new TextRun({ text: priority.acao, color: DARK, size: 22, font: "Arial" }),
        ],
      }),
    );
  });

  children.push(
    sectionTitle("Próximo passo"),
    body(summary.proximoPasso),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 520 },
      children: [
        new TextRun({
          text: "Relatório preparado pela Tupiniquim",
          italics: true,
          color: MUTED,
          size: 20,
          font: "Arial",
        }),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22, color: DARK },
          paragraph: { spacing: { line: 300 } },
        },
      },
    },
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${hostname.toLowerCase()}_relatorio_cliente.docx`);
}
