import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import fileSaver from "file-saver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DEFAULT_INSTITUTION,
  SHAREHOLDERS,
  BRANCHES,
  amountWords,
  emptyRep,
  emptyTxn,
  fmt,
  generateTransactions,
  makeReference,
  num,
  type FormState,
  type Institution,
} from "@/lib/mmoccul";
import { buildDocument } from "@/lib/generateDocx";

const { saveAs } = fileSaver;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MMOCCUL Document Generator | Official Member Documents" },
      {
        name: "description",
        content:
          "Generate official MMOCKMBIE Credit Union attestations and member account statements as a single Word document in under two minutes.",
      },
      { property: "og:title", content: "MMOCCUL Document Generator" },
      {
        property: "og:description",
        content:
          "Staff tool to produce attestations of bank account, non-indebtedness, domiciliation and member statements as .docx.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const today = () => new Date().toISOString().slice(0, 10);

function blankForm(): FormState {
  return {
    memberName: "",
    accountNumber: "",
    memberNumber: "",
    branchName: DEFAULT_INSTITUTION.branch,
    closingBalance: "",
    amountInWords: "",
    issueDate: today(),
    openingDate: "",
    startDate: "",
    endDate: today(),
    openingBalance: "",
    ourRef: "MMOCCUL /ATT/07/2026",
    gender: "his",
    bfDebit: "",
    bfCredit: "",
    transactions: [emptyTxn()],
    reps: [emptyRep()],
  };
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

function Index() {
  const [form, setForm] = useState<FormState>(blankForm);
  const [inst, setInst] = useState<Institution>(DEFAULT_INSTITUTION);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [gen, setGen] = useState({ totalDebit: "", totalCredit: "", count: "12" });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setTxn = (id: string, key: keyof ReturnType<typeof emptyTxn>, value: string) =>
    setForm((f) => ({
      ...f,
      transactions: f.transactions.map((t) => (t.id === id ? { ...t, [key]: value } : t)),
    }));

  const totals = form.transactions.reduce(
    (acc, t) => ({ debit: acc.debit + num(t.debit), credit: acc.credit + num(t.credit) }),
    { debit: 0, credit: 0 },
  );
  const computedClosing = num(form.openingBalance) - totals.debit + totals.credit;

  const runningBalances = (() => {
    let r = num(form.openingBalance);
    return form.transactions.map((t) => {
      r = r - num(t.debit) + num(t.credit);
      return r;
    });
  })();

  function autoGenerate() {
    setError(null);
    if (!form.startDate || !form.endDate) {
      setError("Statement start and end dates are required to distribute transactions.");
      return;
    }
    const rows = generateTransactions(
      {
        totalDebit: num(gen.totalDebit),
        totalCredit: num(gen.totalCredit),
        count: Math.max(1, Math.floor(num(gen.count) || 1)),
        startDate: form.startDate,
        endDate: form.endDate,
        memberName: form.memberName,
        memberNumber: form.memberNumber,
        reps: form.reps,
      },
      num(form.openingBalance),
    );
    if (rows.length === 0) {
      setError("Provide a total debit and/or total credit amount to generate transactions.");
      return;
    }
    setForm((f) => ({
      ...f,
      transactions: rows,
      closingBalance: String(
        num(f.openingBalance) - num(gen.totalDebit) + num(gen.totalCredit),
      ),
    }));
  }

  function addRow() {
    const t = emptyTxn();
    t.representative = form.memberName.toUpperCase();
    t.date = form.endDate;
    t.reference = makeReference(form.endDate || today(), form.transactions.length + 1);
    set("transactions", [...form.transactions, t]);
  }

  async function generate() {
    setError(null);
    if (!form.memberName.trim() || !form.accountNumber.trim() || form.closingBalance === "") {
      setError("Member full name, account number and closing balance are required.");
      return;
    }
    if (!form.issueDate) {
      setError("Issue date is required.");
      return;
    }
    setBusy(true);
    try {
      const blob = await buildDocument(form, inst);
      const safe = form.memberName.trim().replace(/\s+/g, "_").replace(/[^\w-]/g, "");
      setResult({ blob, name: `MMOCCUL_Documents_${safe}_${form.issueDate}.docx` });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate the document.");
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    setForm(blankForm());
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {inst.slogan}
          </p>
          <h1 className="text-xl font-bold sm:text-2xl">MMOCCUL Document Generator</h1>
          <p className="text-sm opacity-80">{inst.name}</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Member Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Member Full Name" required>
              <Input
                value={form.memberName}
                onChange={(e) => set("memberName", e.target.value)}
                placeholder="e.g. JANE AKUM NDIVE"
              />
            </Field>
            <Field label="Account Number" required>
              <Input
                value={form.accountNumber}
                onChange={(e) => set("accountNumber", e.target.value)}
                placeholder="37360134401"
              />
            </Field>
            <Field label="Member / Statement No.">
              <Input
                value={form.memberNumber}
                onChange={(e) => set("memberNumber", e.target.value)}
                placeholder="601344"
              />
            </Field>
            <Field label="Branch Name" required>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.branchName}
                onChange={(e) => set("branchName", e.target.value)}
              >
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
                {!BRANCHES.includes(form.branchName as (typeof BRANCHES)[number]) && form.branchName ? (
                  <option value={form.branchName}>{form.branchName}</option>
                ) : null}
              </select>
            </Field>
            <Field label="Shareholder Bank">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={inst.shareholder}
                onChange={(e) => setInst((s) => ({ ...s, shareholder: e.target.value }))}
              >
                {SHAREHOLDERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                {SHAREHOLDERS.includes(inst.shareholder as (typeof SHAREHOLDERS)[number]) ? null : (
                  <option value={inst.shareholder}>{inst.shareholder}</option>
                )}
              </select>
            </Field>
            <Field label="Closing Balance (FCFA)" required>
              <Input
                inputMode="numeric"
                value={form.closingBalance}
                onChange={(e) => set("closingBalance", e.target.value)}
                placeholder="3575680"
              />
            </Field>
            <Field label="Amount in Words (optional)">
              <Input
                value={form.amountInWords}
                onChange={(e) => set("amountInWords", e.target.value)}
                placeholder={
                  form.closingBalance ? amountWords(num(form.closingBalance)) : "Auto-generated"
                }
              />
            </Field>
            <Field label="Pronoun in attestation">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value as FormState["gender"])}
              >
                <option value="his">his</option>
                <option value="her">her</option>
              </select>
            </Field>
            <Field label="Issue Date" required>
              <Input
                type="date"
                value={form.issueDate}
                onChange={(e) => set("issueDate", e.target.value)}
              />
            </Field>
            <Field label="Account Opening Date">
              <Input
                type="date"
                value={form.openingDate}
                onChange={(e) => set("openingDate", e.target.value)}
              />
            </Field>
            <Field label="Our Reference">
              <Input value={form.ourRef} onChange={(e) => set("ourRef", e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Statement Period</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <Field label="Statement Start Date">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </Field>
            <Field label="Statement End Date">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </Field>
            <Field label="Opening Balance (FCFA)">
              <Input
                inputMode="numeric"
                value={form.openingBalance}
                onChange={(e) => set("openingBalance", e.target.value)}
                placeholder="3374425"
              />
            </Field>
            <Field label="Brought-forward Debit (FCFA)">
              <Input
                inputMode="numeric"
                value={form.bfDebit}
                onChange={(e) => set("bfDebit", e.target.value)}
                placeholder="23015000"
              />
            </Field>
            <Field label="Brought-forward Credit (FCFA)">
              <Input
                inputMode="numeric"
                value={form.bfCredit}
                onChange={(e) => set("bfCredit", e.target.value)}
                placeholder="26389425"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Auto-generate Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the period totals and the tool will distribute debits and credits across the
              statement period, with unique references generated per operation date.
            </p>
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Representatives (leave times blank to let the tool decide)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => set("reps", [...form.reps, emptyRep()])}
                >
                  + Add Representative
                </Button>
              </div>
              {form.reps.map((r) => (
                <div key={r.id} className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
                  <Input
                    value={r.name}
                    placeholder={form.memberName.toUpperCase() || "Representative name"}
                    onChange={(e) =>
                      set(
                        "reps",
                        form.reps.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)),
                      )
                    }
                  />
                  <Input
                    inputMode="numeric"
                    value={r.count}
                    placeholder="Times (auto)"
                    onChange={(e) =>
                      set(
                        "reps",
                        form.reps.map((x) => (x.id === r.id ? { ...x, count: e.target.value } : x)),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => set("reps", form.reps.filter((x) => x.id !== r.id))}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Total Debit (FCFA)">
                <Input
                  inputMode="numeric"
                  value={gen.totalDebit}
                  onChange={(e) => setGen((g) => ({ ...g, totalDebit: e.target.value }))}
                  placeholder="18020000"
                />
              </Field>
              <Field label="Total Credit (FCFA)">
                <Input
                  inputMode="numeric"
                  value={gen.totalCredit}
                  onChange={(e) => setGen((g) => ({ ...g, totalCredit: e.target.value }))}
                  placeholder="18221255"
                />
              </Field>
              <Field label="Number of Transactions">
                <Input
                  inputMode="numeric"
                  value={gen.count}
                  onChange={(e) => setGen((g) => ({ ...g, count: e.target.value }))}
                  placeholder="24"
                />
              </Field>
              <div className="flex items-end">
                <Button type="button" className="w-full" onClick={autoGenerate}>
                  Generate Transactions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-primary">Transactions</CardTitle>
            <Button type="button" onClick={addRow}>
              + Add Transaction
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 font-semibold">Date</th>
                    <th className="px-2 font-semibold">Description</th>
                    <th className="px-2 font-semibold">Representative</th>
                    <th className="px-2 font-semibold">Reference</th>
                    <th className="px-2 font-semibold">Debit</th>
                    <th className="px-2 font-semibold">Credit</th>
                    <th className="px-2 font-semibold">Balance</th>
                    <th className="px-2 font-semibold">Sens</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {form.transactions.map((t, i) => (
                    <tr key={t.id}>
                      <td className="px-1">
                        <Input
                          type="date"
                          value={t.date}
                          onChange={(e) => setTxn(t.id, "date", e.target.value)}
                        />
                      </td>
                      <td className="px-1">
                        <Input
                          value={t.description}
                          placeholder="CASH IN MEMBERS SAVINGS"
                          onChange={(e) => setTxn(t.id, "description", e.target.value)}
                        />
                      </td>
                      <td className="px-1">
                        <Input
                          value={t.representative}
                          placeholder={form.memberName.toUpperCase() || "Representative"}
                          onChange={(e) => setTxn(t.id, "representative", e.target.value)}
                        />
                      </td>
                      <td className="px-1">
                        <Input
                          value={t.reference}
                          onChange={(e) => setTxn(t.id, "reference", e.target.value)}
                        />
                      </td>
                      <td className="px-1">
                        <Input
                          inputMode="numeric"
                          value={t.debit}
                          onChange={(e) => setTxn(t.id, "debit", e.target.value)}
                        />
                      </td>
                      <td className="px-1">
                        <Input
                          inputMode="numeric"
                          value={t.credit}
                          onChange={(e) => setTxn(t.id, "credit", e.target.value)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-2 text-right tabular-nums">
                        {fmt(runningBalances[i] ?? 0)}
                      </td>
                      <td className="px-2 text-center">
                        {(runningBalances[i] ?? 0) < 0 ? "Dr" : "Cr"}
                      </td>
                      <td className="px-1">
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() =>
                            set(
                              "transactions",
                              form.transactions.filter((x) => x.id !== t.id),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-6 text-sm">
              <span>
                Total debit: <strong>{fmt(totals.debit)}</strong>
              </span>
              <span>
                Total credit: <strong>{fmt(totals.credit)}</strong>
              </span>
              <span>
                Computed closing: <strong>{fmt(computedClosing)} FCFA</strong>
              </span>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible>
          <AccordionItem value="settings">
            <AccordionTrigger className="text-primary">Institution settings</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(DEFAULT_INSTITUTION) as Array<keyof Institution>).map((k) => (
                  <Field key={k} label={k.replace(/([A-Z])/g, " $1")}>
                    <Input
                      value={inst[k]}
                      onChange={(e) => setInst((s) => ({ ...s, [k]: e.target.value }))}
                    />
                  </Field>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" className="text-base" disabled={busy} onClick={generate}>
            {busy ? "Generating…" : "Generate Document"}
          </Button>
          <Button size="lg" variant="outline" onClick={clearAll}>
            Clear Form
          </Button>
        </div>

        {result ? (
          <Card className="border-accent">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div>
                <p className="font-semibold text-primary">Document generated successfully</p>
                <p className="text-sm text-muted-foreground">{result.name}</p>
              </div>
              <Button size="lg" onClick={() => saveAs(result.blob, result.name)}>
                Download .docx
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}