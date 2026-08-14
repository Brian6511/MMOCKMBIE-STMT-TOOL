import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  PageBreak,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  TabStopType,
  WidthType,
} from "docx";
import {
  amountWords,
  dayOfMonthYear,
  fmt,
  longDate,
  num,
  makeReference,
  shortDate,
  type FormState,
  type Institution,
} from "./mmoccul";

const CONTENT_W = 9360;
const NAVY = "003366";
const CYAN = "00AEEF";
/** The originals are typed in Times New Roman 12pt; the statement is 7pt Arial. */
const SERIF = "Times New Roman";
const SANS = "Arial";

const thin = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const cellBorders = { top: thin, bottom: thin, left: thin, right: thin };

function p(text: string, opts: Partial<{ bold: boolean; size: number; align: (typeof AlignmentType)[keyof typeof AlignmentType]; color: string; italics: boolean; spacingAfter: number; allCaps: boolean }> = {}) {
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    spacing: { after: opts.spacingAfter ?? 120, line: 300 },
    children: [
      new TextRun({
        text,
        bold: !!opts.bold,
        italics: !!opts.italics,
        size: opts.size ?? 22,
        color: opts.color ?? "000000",
        font: SERIF,
      }),
    ],
  });
}

function rich(runs: Array<{ text: string; bold?: boolean }>, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED) {
  return new Paragraph({
    alignment: align,
    spacing: { after: 160, line: 320 },
    children: runs.map((r) => new TextRun({ text: r.text, bold: !!r.bold, size: 24, font: SERIF })),
  });
}

/** Blank space where the pre-printed letterhead sits. */
function topSpace() {
  return [p("", { spacingAfter: 240 })];
}

/** "Done in Buea, this 24th day of June, 2026" — centered, as on the originals. */
function doneIn(f: FormState, inst: Institution) {
  const branch = (f.branchName || inst.branch || inst.city).trim();
  return [
    p("", { spacingAfter: 240 }),
    p(`Done in ${branch}, this ${dayOfMonthYear(f.issueDate)}`, {
      align: AlignmentType.CENTER,
      bold: true,
      spacingAfter: 240,
    }),
  ];
}

function headerCell(text: string, width: number, size = 16) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: NAVY, type: ShadingType.CLEAR, color: "auto" },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size, color: "FFFFFF", font: SANS })],
      }),
    ],
  });
}

function bodyCell(text: string, width: number, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; fill?: string; size?: number } = {}) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    ...(opts.fill ? { shading: { fill: opts.fill, type: ShadingType.CLEAR, color: "auto" } } : {}),
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        children: [new TextRun({ text, bold: !!opts.bold, size: opts.size ?? 16, font: SANS })],
      }),
    ],
  });
}

function attestationOfAccount(f: FormState, inst: Institution, words: string) {
  const pronoun = f.gender === "her" ? "her" : "his";
  return [
    ...topSpace(),
    p(longDate(f.issueDate, true), { align: AlignmentType.RIGHT, bold: true, spacingAfter: 240 }),
    p(`OUR REF: ${f.ourRef}`, { bold: true, spacingAfter: 40 }),
    p("YOUR REF: ..............................", { spacingAfter: 240 }),
    p("TO WHOM IT MAY CONCERN", { bold: true, spacingAfter: 240 }),
    p("ATTESTATION OF BANK ACCOUNT", { bold: true, size: 26, align: AlignmentType.CENTER, color: NAVY, spacingAfter: 320 }),
    rich([
      { text: `The ${inst.name} an affiliate to the ${inst.affiliate}, authorised to operate as a micro financial institution under ${inst.regNo} and ${inst.cobac}, and a shareholder in ${inst.shareholder} hereby attest that ` },
      { text: f.memberName.toUpperCase(), bold: true },
      { text: " is a member of this financial institution and operates a savings and current account number " },
      { text: f.accountNumber, bold: true },
      { text: " in our books." },
    ]),
    rich([
      { text: `As at today ${longDate(f.issueDate)}, ${pronoun} account has a credit balance of ` },
      { text: `${fmt(f.closingBalance)} FCFA`, bold: true },
      { text: ` (${words}).` },
    ]),
    p("We hereby confirm that:", { bold: true, spacingAfter: 80 }),
    rich([{ text: "The funds indicated above are readily available to the account holder." }], AlignmentType.LEFT),
    rich([{ text: "The funds are free from any lien, hold, or encumbrance." }], AlignmentType.LEFT),
    rich([
      {
        text: `The client has no outstanding loans, overdrafts, or credit facilities with ${inst.name.replace(/\s*\(MFI\)/, "")}.`,
      },
    ], AlignmentType.LEFT),
    rich([{ text: "In testimony whereof, this attestation is issued to serve the purpose for which it deserves." }]),
    ...doneIn(f, inst),
  ];
}

function attestationOfNonIndebtedness(f: FormState, inst: Institution) {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    ...topSpace(),
    p(`OUR REF: ${f.ourRef}`, { bold: true, spacingAfter: 240 }),
    p("TO WHOM IT MAY CONCERN", { bold: true, spacingAfter: 240 }),
    p("ATTESTATION OF NON INDEBTEDNESS", { bold: true, size: 26, align: AlignmentType.CENTER, color: NAVY, spacingAfter: 320 }),
    rich([
      { text: `The ${inst.name} an affiliate to the ${inst.affiliate}, authorised to operate as a micro financial institution under ${inst.regNo} and ${inst.cobac}, and a shareholder in ${inst.shareholder} hereby attest that ` },
      { text: f.memberName.toUpperCase(), bold: true },
      { text: " who operates a savings and current account number " },
      { text: f.accountNumber, bold: true },
      { text: " in our books is not indebted to MMOCCUL as at date." },
    ]),
    rich([{ text: "IN TESTIMONY WHEREOF, THIS ATTESTATION IS ISSUED TO SERVE THE PURPOSE FOR WHICH IT DESERVES." }]),
    ...doneIn(f, inst),
  ];
}

function attestationOfDomiciliation(f: FormState, inst: Institution) {
  const widths = [1700, 1700, 2560, 1200, 2200];
  const heads = ["BANK CODE", "BRANCH CODE", "ACCOUNT NUMBER", "RIB KEY", "SWIFT CODE"];
  const vals = [inst.bankCode, inst.branchCode, inst.bankAccountNumber, inst.ribKey, inst.swift];
  return [
    new Paragraph({ children: [new PageBreak()] }),
    ...topSpace(),
    p(`OUR REF: ${f.ourRef}`, { bold: true, spacingAfter: 40 }),
    p("YOUR REF: ..............................", { spacingAfter: 240 }),
    p("TO WHOM IT MAY CONCERN", { bold: true, spacingAfter: 200 }),
    p("ATTESTATION OF DOMICILIATION OF BANK ACCOUNT", { bold: true, size: 26, align: AlignmentType.CENTER, color: NAVY, spacingAfter: 320 }),
    rich([
      { text: `The ${inst.name} authorised to operate as a micro financial institution under ${inst.regNo}, a shareholder of ${inst.shareholder}, operating account number:` },
    ]),
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: widths,
      rows: [
        new TableRow({ children: heads.map((h, i) => headerCell(h, widths[i] as number)) }),
        new TableRow({
          children: vals.map((v, i) => bodyCell(v, widths[i] as number, { align: AlignmentType.CENTER, bold: true })),
        }),
      ],
    }),
    p("", { spacingAfter: 120 }),
    p(`IBAN ${inst.iban}`, { bold: true, align: AlignmentType.CENTER, size: 24, color: NAVY, spacingAfter: 280 }),
    rich([
      { text: "We hereby attest that " },
      { text: f.memberName.toUpperCase(), bold: true },
      { text: " has a savings account with the above Financial Institution with account number " },
      { text: f.accountNumber, bold: true },
      { text: f.openingDate ? ` since ${shortDate(f.openingDate)}.` : "." },
    ]),
    rich([{ text: "IN TESTIMONY WHEREOF THIS ATTESTATION IS ISSUED TO SERVE THE PURPOSE FOR WHICH IT DESERVES." }]),
    ...doneIn(f, inst),
  ];
}

const SMALL = 14; // 7pt, matches the printed statement

function stmtHead(text: string, width: number) {
  return headerCell(text, width, SMALL);
}

function stmtCell(
  text: string,
  width: number,
  opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; fill?: string } = {},
) {
  return bodyCell(text, width, { ...opts, size: SMALL });
}

function statement(f: FormState, inst: Institution) {
  const widths = [950, 2150, 1400, 1750, 950, 950, 900, 310];
  const heads = [
    "Optn Date",
    "Description",
    "Representative",
    "Reference",
    "Debit",
    "Credit",
    "Balance",
    "Sens",
  ];
  const w = (i: number) => widths[i] as number;
  const opening = num(f.openingBalance);
  let running = opening;
  let totalDebit = 0;
  let totalCredit = 0;
  const sens = (v: number) => (v < 0 ? "Dr" : "Cr");

  const rows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: heads.map((h, i) => stmtHead(h, w(i))),
    }),
    new TableRow({
      children: [
        stmtCell(shortDate(f.startDate), w(0), { fill: "EAF6FC", align: AlignmentType.CENTER }),
        stmtCell(`Balance brought forward / Solde au ${shortDate(f.startDate)}`, w(1), {
          bold: true,
          fill: "EAF6FC",
        }),
        stmtCell(f.memberName.toUpperCase(), w(2), { fill: "EAF6FC" }),
        stmtCell("-", w(3), { fill: "EAF6FC", align: AlignmentType.CENTER }),
        stmtCell(fmt(f.bfDebit || 0), w(4), { fill: "EAF6FC", align: AlignmentType.RIGHT }),
        stmtCell(fmt(f.bfCredit || 0), w(5), { fill: "EAF6FC", align: AlignmentType.RIGHT }),
        stmtCell(fmt(opening), w(6), { bold: true, align: AlignmentType.RIGHT, fill: "EAF6FC" }),
        stmtCell(sens(opening), w(7), { fill: "EAF6FC", align: AlignmentType.CENTER }),
      ],
    }),
  ];

  f.transactions.forEach((t, idx) => {
    const d = num(t.debit);
    const c = num(t.credit);
    totalDebit += d;
    totalCredit += c;
    running = running - d + c;
    const ref = t.reference?.trim() || makeReference(t.date || f.endDate, idx + 1);
    rows.push(
      new TableRow({
        children: [
          stmtCell(shortDate(t.date) || shortDate(f.endDate), w(0), { align: AlignmentType.CENTER }),
          stmtCell(t.description || `CASH ${c ? "IN" : "OUT"} ${f.memberNumber} MEMBERS SAVINGS`, w(1)),
          stmtCell(t.representative?.trim() || f.memberName.toUpperCase(), w(2)),
          stmtCell(ref, w(3)),
          stmtCell(fmt(d), w(4), { align: AlignmentType.RIGHT }),
          stmtCell(fmt(c), w(5), { align: AlignmentType.RIGHT }),
          stmtCell(fmt(running), w(6), { align: AlignmentType.RIGHT }),
          stmtCell(sens(running), w(7), { align: AlignmentType.CENTER }),
        ],
      }),
    );
  });

  rows.push(
    new TableRow({
      children: [
        stmtCell("-", w(0), { fill: "E2E8F0", align: AlignmentType.CENTER }),
        stmtCell("TOTAL PERIOD / TOTAL PERIODE", w(1), { bold: true, fill: "E2E8F0" }),
        stmtCell("-", w(2), { fill: "E2E8F0" }),
        stmtCell("-", w(3), { fill: "E2E8F0", align: AlignmentType.CENTER }),
        stmtCell(fmt(totalDebit), w(4), { bold: true, align: AlignmentType.RIGHT, fill: "E2E8F0" }),
        stmtCell(fmt(totalCredit), w(5), { bold: true, align: AlignmentType.RIGHT, fill: "E2E8F0" }),
        stmtCell(fmt(running), w(6), { bold: true, align: AlignmentType.RIGHT, fill: "E2E8F0" }),
        stmtCell(sens(running), w(7), { bold: true, fill: "E2E8F0", align: AlignmentType.CENTER }),
      ],
    }),
  );

  const label = (text: string, bold = false) =>
    new Paragraph({
      spacing: { after: 0 },
      children: [new TextRun({ text, size: SMALL, bold, font: SANS })],
    });

  const sumCell = (lines: string[], width: number, opts: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) =>
    new TableCell({
      borders: cellBorders,
      width: { size: width, type: WidthType.DXA },
      margins: { top: 40, bottom: 40, left: 60, right: 60 },
      children: lines.map(
        (line) =>
          new Paragraph({
            alignment: opts.align ?? AlignmentType.LEFT,
            spacing: { after: 0 },
            children: [new TextRun({ text: line, size: SMALL, bold: !!opts.bold, font: SANS })],
          }),
      ),
    });

  const sw = [2340, 2340, 2340, 2340];
  const summary = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: sw,
    rows: [
      new TableRow({
        children: [
          sumCell(["Balance brought forward :", "Solde debut periode :"], sw[0] as number),
          sumCell([fmt(opening)], sw[1] as number, { bold: true, align: AlignmentType.RIGHT }),
          sumCell(["Number Trxn Period", "Total Trxn Periode"], sw[2] as number),
          sumCell([String(f.transactions.length)], sw[3] as number, { bold: true, align: AlignmentType.RIGHT }),
        ],
      }),
      new TableRow({
        children: [
          sumCell(["Total Debit Period :", "Total Debit Periode :"], sw[0] as number),
          sumCell([fmt(totalDebit)], sw[1] as number, { bold: true, align: AlignmentType.RIGHT }),
          sumCell(["Total Credit Period :", "Total Credit Periode :"], sw[2] as number),
          sumCell([fmt(totalCredit)], sw[3] as number, { bold: true, align: AlignmentType.RIGHT }),
        ],
      }),
      new TableRow({
        children: [
          sumCell(["Balance as at :", `Solde au ${shortDate(f.endDate)} :`], sw[0] as number),
          sumCell([`${fmt(running)} ${sens(running)}`], sw[1] as number, { bold: true, align: AlignmentType.RIGHT }),
          sumCell(["Currency / Devise :"], sw[2] as number),
          sumCell([inst.currency], sw[3] as number, { bold: true, align: AlignmentType.RIGHT }),
        ],
      }),
    ],
  });

  const info = (leftLabel: string, leftValue: string, rightLabel: string, rightValue: string) =>
    new Paragraph({
      spacing: { after: 40 },
      tabStops: [
        { type: TabStopType.RIGHT, position: 9360 },
      ],
      children: [
        new TextRun({ text: `${leftLabel} `, italics: true, size: SMALL, font: SANS }),
        new TextRun({ text: leftValue, bold: true, size: SMALL, font: SANS }),
        new TextRun({ text: `\t${rightLabel} `, italics: true, size: SMALL, font: SANS }),
        new TextRun({ text: rightValue, bold: true, size: SMALL, font: SANS }),
      ],
    });

  return [
    new Paragraph({ children: [new PageBreak()] }),
    p("MEMBER ACCOUNT STATEMENT", {
      bold: true,
      size: 20,
      align: AlignmentType.CENTER,
      color: NAVY,
      spacingAfter: 160,
    }),
    info("Branch/Agence:", f.branchName || inst.branch, "Currency/Devise:", inst.currency),
    info("Date:", shortDate(f.issueDate), "Start Date/Date Debut:", shortDate(f.startDate)),
    info(
      "Account No./No. Compte:",
      `${f.memberNumber || "-"}   Members Savings ${f.accountNumber}`,
      "End Date/Date Fin:",
      shortDate(f.endDate),
    ),
    info("Account Name/Nom du Compte:", f.memberName.toUpperCase(), "Statement No.:", f.memberNumber || "-"),
    p("", { spacingAfter: 80 }),
    new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows }),
    p("", { spacingAfter: 160 }),
    summary,
  ];
}

export async function buildDocument(f: FormState, inst: Institution): Promise<Blob> {
  const words =
    f.amountInWords.trim() !== ""
      ? f.amountInWords.trim().toUpperCase()
      : amountWords(num(f.closingBalance));

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 30, bold: true, font: "Arial", color: NAVY },
          paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 },
          },
        },
        children: [
          ...attestationOfAccount(f, inst, words),
          ...attestationOfNonIndebtedness(f, inst),
          ...attestationOfDomiciliation(f, inst),
          ...statement(f, inst),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

export { HeadingLevel };