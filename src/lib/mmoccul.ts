export type Txn = {
  id: string;
  date: string;
  description: string;
  representative: string;
  reference: string;
  debit: string;
  credit: string;
};

export type GenOptions = {
  totalDebit: number;
  totalCredit: number;
  count: number;
  startDate: string;
  endDate: string;
  memberName: string;
  memberNumber: string;
  /** Representatives and how many rows each should appear on. */
  reps?: Rep[];
};

export type Rep = {
  id: string;
  name: string;
  count: string;
};

export function emptyRep(): Rep {
  return { id: Math.random().toString(36).slice(2), name: "", count: "" };
}

export const SHAREHOLDERS = [
  "United Bank for Africa (UBA)",
  "National Financial Credit Plc. (NFC Bank)",
  "Afriland First Bank Plc.",
] as const;

export const BRANCHES = [
  "Yaoundé – Monte Centre (Headquarters / Corporate Office)",
  "Yaoundé – Etoug-Ebe",
  "Yaoundé – Damas",
  "Yaoundé – Messassi",
  "Douala – Bonaberi",
  "Douala – Village",
  "Bafoussam",
  "Bamenda",
  "Buea",
  "Dschang",
  "Kumba",
  "Bertoua",
  "Mmockmbie",
  "Kribi",
] as const;

/**
 * Expand the representative list into one entry per transaction row.
 * A blank count means the tool decides how many times that name appears;
 * the final assignment is shuffled so names are not in a predictable order.
 */
export function repPool(reps: Rep[] | undefined, fallback: string, total: number): string[] {
  const names = (reps ?? [])
    .map((r) => ({ name: r.name.trim().toUpperCase(), count: Math.floor(num(r.count) || 0) }))
    .filter((r) => r.name);
  if (names.length === 0) names.push({ name: fallback.toUpperCase(), count: 0 });

  const pool: string[] = [];
  for (const r of names) for (let i = 0; i < r.count; i++) pool.push(r.name);

  // Fill the remaining rows randomly among all provided names.
  const auto = names.filter((r) => r.count <= 0);
  const fillFrom = auto.length > 0 ? auto : names;
  while (pool.length < total) {
    const pick = fillFrom[Math.floor(Math.random() * fillFrom.length)];
    pool.push((pick?.name ?? fallback.toUpperCase()) as string);
  }

  // Shuffle then trim to the row count.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j] as string, pool[i] as string];
  }
  return pool.slice(0, total);
}

export type Institution = {
  name: string;
  affiliate: string;
  regNo: string;
  cobac: string;
  minfi: string;
  shareholder: string;
  slogan: string;
  city: string;
  branch: string;
  tel: string;
  email: string;
  website: string;
  poBox: string;
  cnps: string;
  taxpayer: string;
  managerName: string;
  bankCode: string;
  branchCode: string;
  bankAccountNumber: string;
  ribKey: string;
  swift: string;
  iban: string;
  currency: string;
};

export const DEFAULT_INSTITUTION: Institution = {
  name: "MMOCKMBIE CREDIT UNION COOPERATIVE LTD (MFI)",
  affiliate: "RAINBOW – CAMEROON Cooperative Credit Union Limited",
  regNo: "Coopgic Reg No. 17/035/CMR/SW/55/290/CCA/360/3601",
  cobac: "COBAC DECISION N° D-2021/317",
  minfi: "0000381",
  shareholder: "United Bank for Africa (UBA)",
  slogan: "Where Dreams are Realised",
  city: "Buea",
  branch: "Yaoundé – Monte Centre (Headquarters / Corporate Office)",
  tel: "+237 680 485 489 / 675 952 741",
  email: "contact@mmoccul.com",
  website: "www.mmoccul.com",
  poBox: "P.O. BOX 313, Buea",
  cnps: "325-0116658-000-E",
  taxpayer: "M071712677486E",
  managerName: "General Manager",
  bankCode: "10025",
  branchCode: "00021",
  bankAccountNumber: "15101070514",
  ribKey: "58",
  swift: "NAFCCMCY",
  iban: "CM21 10025 00021 15101070514 58",
  currency: "XAF Franc Cfa",
};

export type FormState = {
  memberName: string;
  accountNumber: string;
  memberNumber: string;
  branchName: string;
  closingBalance: string;
  amountInWords: string;
  issueDate: string;
  openingDate: string;
  startDate: string;
  endDate: string;
  openingBalance: string;
  ourRef: string;
  gender: "his" | "her";
  bfDebit: string;
  bfCredit: string;
  transactions: Txn[];
  reps: Rep[];
};

export type GenState = {
  totalDebit: string;
  totalCredit: string;
  count: string;
  bfDebit: string;
  bfCredit: string;
};

export function num(v: string | number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Cameroon style: spaces as thousand separators. */
export function fmt(v: string | number): string {
  const n = Math.round(num(v));
  return n.toLocaleString("en-US").replace(/,/g, " ");
}

const ONES = [
  "ZERO","ONE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE","TEN",
  "ELEVEN","TWELVE","THIRTEEN","FOURTEEN","FIFTEEN","SIXTEEN","SEVENTEEN","EIGHTEEN","NINETEEN",
];
const TENS = ["","","TWENTY","THIRTY","FORTY","FIFTY","SIXTY","SEVENTY","EIGHTY","NINETY"];

function below1000(n: number): string {
  if (n < 20) return ONES[n] ?? "";
  if (n < 100) {
    const t = TENS[Math.floor(n / 10)] ?? "";
    const r = n % 10;
    return r ? `${t} ${ONES[r]}` : t;
  }
  const h = `${ONES[Math.floor(n / 100)]} HUNDRED`;
  const r = n % 100;
  return r ? `${h} AND ${below1000(r)}` : h;
}

export function numberToWords(value: number): string {
  let n = Math.round(Math.abs(value));
  if (n === 0) return "ZERO";
  const units: Array<[number, string]> = [
    [1_000_000_000, "BILLION"],
    [1_000_000, "MILLION"],
    [1_000, "THOUSAND"],
  ];
  const parts: string[] = [];
  for (const [div, label] of units) {
    if (n >= div) {
      parts.push(`${below1000(Math.floor(n / div))} ${label}`);
      n %= div;
    }
  }
  if (n > 0) parts.push(below1000(n));
  return parts.join(" ");
}

export function amountWords(value: number): string {
  return `${numberToWords(value)} FRANCS`;
}

function ordinal(d: number): string {
  if (d > 3 && d < 21) return `${d}th`;
  switch (d % 10) {
    case 1: return `${d}st`;
    case 2: return `${d}nd`;
    case 3: return `${d}rd`;
    default: return `${d}th`;
  }
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function longDate(iso: string, upper = false): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const s = `${ordinal(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return upper ? s.toUpperCase() : s;
}

/** "24th day of June, 2026" as printed on the attestations. */
export function dayOfMonthYear(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${ordinal(d.getDate())} day of ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

export function shortDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function emptyTxn(): Txn {
  return {
    id: Math.random().toString(36).slice(2),
    date: "",
    description: "",
    representative: "",
    reference: "",
    debit: "",
    credit: "",
  };
}

function pad(n: number, w: number): string {
  return String(n).padStart(w, "0");
}

/** DEPRET + ddMMyy + 8-digit unique sequence, as printed on MMOCCUL statements. */
export function makeReference(iso: string, seq: number): string {
  const d = new Date(`${iso}T00:00:00`);
  const day = Number.isNaN(d.getTime()) ? 1 : d.getDate();
  const mon = Number.isNaN(d.getTime()) ? 1 : d.getMonth() + 1;
  const yr = Number.isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  return `DEPRET${pad(day, 2)}${pad(mon, 2)}${String(yr).slice(2)}${pad(seq, 8)}`;
}

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
}

/** Spread `count` dates evenly (with slight jitter) across the statement period. */
function spreadDates(startIso: string, endIso: string, count: number): string[] {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || count <= 0) return [];
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000));
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const base = ((i + 1) * days) / (count + 1);
    const jitter = (Math.random() - 0.5) * (days / (count + 1)) * 0.8;
    const offset = Math.min(days, Math.max(1, Math.round(base + jitter)));
    const d = new Date(start.getTime() + offset * 86_400_000);
    out.push(isoOf(d));
  }
  return out.sort();
}

/** Split a total into `n` positive amounts rounded to 5 000, exact to the franc. */
function splitAmount(total: number, n: number): number[] {
  if (n <= 0 || total <= 0) return [];
  if (n === 1) return [total];
  const weights = Array.from({ length: n }, () => 0.4 + Math.random());
  const sum = weights.reduce((a, b) => a + b, 0);
  const parts = weights.map((w) => Math.max(5000, Math.round((total * w) / sum / 5000) * 5000));
  let diff = total - parts.reduce((a, b) => a + b, 0);
  let i = 0;
  while (diff !== 0 && i < parts.length * 50) {
    const idx = i % parts.length;
    const step = diff > 0 ? Math.min(diff, 5000) : Math.max(diff, -5000);
    const next = (parts[idx] as number) + step;
    if (next >= 5000) {
      parts[idx] = next;
      diff -= step;
    }
    i++;
  }
  if (diff !== 0) parts[parts.length - 1] = (parts[parts.length - 1] as number) + diff;
  return parts;
}

/**
 * Build a realistic transaction table from period totals: dates are distributed
 * between the statement start and end dates, the running balance never goes
 * negative, and references are uniquely generated per operation date.
 */
export function generateTransactions(opts: GenOptions, openingBalance: number): Txn[] {
  const count = Math.max(1, Math.floor(opts.count));
  const debitCount = opts.totalDebit > 0 ? Math.max(1, Math.round(count / 2)) : 0;
  const creditCount = opts.totalCredit > 0 ? Math.max(1, count - debitCount) : 0;
  const total = debitCount + creditCount;
  if (total === 0) return [];

  const debits = splitAmount(opts.totalDebit, debitCount);
  const credits = splitAmount(opts.totalCredit, creditCount);
  const dates = spreadDates(opts.startDate, opts.endDate, total);
  const reps = repPool(opts.reps, opts.memberName, total);

  const acct = opts.memberNumber || "";
  const out: Txn[] = [];
  let balance = openingBalance;
  let di = 0;
  let ci = 0;
  let seq = Math.floor(Math.random() * 400) + 20;

  for (let i = 0; i < total; i++) {
    const date = dates[i] ?? opts.endDate;
    const rep = reps[i] ?? opts.memberName.toUpperCase();
    const nextDebit = debits[di];
    const canDebit = di < debits.length && balance - (nextDebit ?? 0) >= 0;
    const takeCredit =
      ci < credits.length && (!canDebit || (di < debits.length ? Math.random() < 0.5 : true));
    seq += Math.floor(Math.random() * 40) + 3;

    if (takeCredit) {
      const amount = credits[ci++] as number;
      balance += amount;
      out.push({
        id: Math.random().toString(36).slice(2),
        date,
        description: `CASH IN ${acct} MEMBERS SAVINGS`,
        representative: rep,
        reference: makeReference(date, seq),
        debit: "",
        credit: String(amount),
      });
    } else if (di < debits.length) {
      const amount = debits[di++] as number;
      balance -= amount;
      out.push({
        id: Math.random().toString(36).slice(2),
        date,
        description: `CASH OUT ${acct} MEMBERS SAVINGS`,
        representative: rep,
        reference: makeReference(date, seq),
        debit: String(amount),
        credit: "",
      });
    }
  }
  return out;
}