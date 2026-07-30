"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X, Loader2, MessageSquareWarning } from "lucide-react";
import { Portrait } from "@/components/portrait";
import { cn } from "@/lib/utils";

export type Pending = {
  id: number;
  lineId: string;
  lineName: string;
  suggestedId: string | null;
  suggestedName: string | null;
  freeText: string | null;
  comment: string | null;
  action: "add" | "remove";
};

export type PendingStat = {
  id: number;
  unitId: string;
  unitName: string;
  /** field label -> [current, proposed] */
  changes: [string, string, string][];
  comment: string | null;
};

export type PendingUnit = {
  id: number;
  name: string;
  civ: string | null;
  unitClass: string;
  isUnique: boolean;
  counters: string[];
  statCount: number;
  comment: string | null;
};

export type PendingReport = {
  id: number;
  message: string;
  page: string | null;
  locale: string | null;
  createdAt: string;
};

export type VoteTally = {
  lineId: string;
  lineName: string;
  accurate: number;
  inaccurate: number;
};

export function SignIn() {
  const t = useTranslations();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
    else setError(t("admin.wrongPassword"));
  }

  return (
    <form onSubmit={submit} className="max-w-xs space-y-3">
      <div>
        <label htmlFor="admin-pw" className="mb-1.5 block text-sm font-medium">
          {t("admin.password")}
        </label>
        <input
          id="admin-pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className={cn(
            "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        />
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("admin.signIn")}
      </button>
    </form>
  );
}

function useReview() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [gone, setGone] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function review(type: string, id: number, action: "approve" | "reject") {
    const key = `${type}:${id}`;
    setBusy(key);
    setError("");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, type }),
    });
    setBusy(null);
    if (res.ok) {
      setGone((g) => [...g, key]);
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "error");
    }
  }

  return { review, busy, gone, error };
}

function Actions({
  type,
  id,
  busy,
  canApprove = true,
  approveTitle,
  approveLabel,
  rejectLabel,
  onReview,
}: {
  type: string;
  id: number;
  busy: string | null;
  canApprove?: boolean;
  approveTitle?: string;
  approveLabel?: string;
  rejectLabel?: string;
  onReview: (type: string, id: number, action: "approve" | "reject") => void;
}) {
  const t = useTranslations();
  const pending = busy === `${type}:${id}`;
  return (
    <span className="ml-auto flex shrink-0 gap-2">
      <button
        type="button"
        disabled={pending || !canApprove}
        title={approveTitle}
        onClick={() => onReview(type, id, "approve")}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/60 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2} />
        {approveLabel ?? t("admin.approve")}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => onReview(type, id, "reject")}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:border-destructive/60 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} />
        {rejectLabel ?? t("admin.reject")}
      </button>
    </span>
  );
}

export function Queue({
  pending,
  stats,
  units,
  reports,
  tallies,
}: {
  pending: Pending[];
  stats: PendingStat[];
  units: PendingUnit[];
  reports: PendingReport[];
  tallies: VoteTally[];
}) {
  const t = useTranslations();
  const { review, busy, gone, error } = useReview();

  const live = <T extends { id: number }>(type: string, rows: T[]) =>
    rows.filter((r) => !gone.includes(`${type}:${r.id}`));

  const counters = live("counter", pending);
  const statRows = live("stats", stats);
  const unitRows = live("unit", units);
  const reportRows = live("report", reports);
  const empty =
    counters.length + statRows.length + unitRows.length + reportRows.length === 0;

  const section = (title: string, count: number, body: React.ReactNode) =>
    count > 0 ? (
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {title} <span className="font-mono">{count}</span>
        </h2>
        {body}
      </section>
    ) : null;

  return (
    <div className="space-y-10">
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {empty && (
        <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          {t("admin.empty")}
        </p>
      )}

      {section(
        t("admin.counterQueue"),
        counters.length,
        <ul className="space-y-2">
          {counters.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <Portrait id={p.lineId} name={p.lineName} size="sm" />
              <span className="text-sm">
                <span className="font-medium">{p.lineName}</span>
                <span className="text-muted-foreground"> {t("admin.suggests")} </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    p.action === "remove"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-primary/15 text-primary"
                  )}
                >
                  {p.action === "remove" ? t("admin.actionRemove") : t("admin.actionAdd")}
                </span>{" "}
                {p.suggestedId ? (
                  <span
                    className={cn("font-medium", p.action === "remove" && "line-through")}
                  >
                    {p.suggestedName}
                  </span>
                ) : (
                  <span className="font-mono text-muted-foreground">{p.freeText}</span>
                )}
              </span>
              {p.comment && (
                <span className="w-full text-xs text-muted-foreground">{p.comment}</span>
              )}
              <Actions
                type="counter"
                id={p.id}
                busy={busy}
                canApprove={!!p.suggestedId}
                approveTitle={p.suggestedId ? undefined : (p.freeText ?? "")}
                onReview={review}
              />
            </li>
          ))}
        </ul>
      )}

      {section(
        t("admin.statQueue"),
        statRows.length,
        <ul className="space-y-2">
          {statRows.map((s) => (
            <li key={s.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex flex-wrap items-center gap-3">
                <Portrait id={s.unitId} name={s.unitName} size="sm" />
                <span className="text-sm font-medium">{s.unitName}</span>
                <Actions type="stats" id={s.id} busy={busy} onReview={review} />
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1">
                {s.changes.map(([label, from, to]) => (
                  <li key={label} className="font-mono text-xs">
                    <span className="text-muted-foreground">{label} </span>
                    <span className="text-muted-foreground line-through">{from}</span>
                    <span className="text-primary"> → {to}</span>
                  </li>
                ))}
              </ul>
              {s.comment && (
                <p className="mt-2 text-xs text-muted-foreground">{s.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {section(
        t("admin.unitQueue"),
        unitRows.length,
        <ul className="space-y-2">
          {unitRows.map((u) => (
            <li key={u.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium">{u.name}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {t(`class.${u.unitClass}`)}
                </span>
                {u.civ && (
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {u.civ}
                  </span>
                )}
                {u.isUnique && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                    {t("unit.unique")}
                  </span>
                )}
                <Actions type="unit" id={u.id} busy={busy} onReview={review} />
              </div>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {t("admin.unitSummary", {
                  counters: u.counters.length,
                  stats: u.statCount,
                })}
              </p>
              {u.comment && <p className="mt-1 text-xs text-muted-foreground">{u.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {section(
        t("admin.reportQueue"),
        reportRows.length,
        <ul className="space-y-2">
          {reportRows.map((r) => (
            <li key={r.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start gap-3">
                <MessageSquareWarning
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />
                {/* whitespace-pre-wrap: people write these with line breaks. */}
                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm">
                  {r.message}
                </p>
                <Actions
                  type="report"
                  id={r.id}
                  busy={busy}
                  approveLabel={t("admin.resolve")}
                  rejectLabel={t("admin.dismiss")}
                  onReview={review}
                />
              </div>
              {(r.page || r.locale) && (
                <p className="mt-2 pl-7 font-mono text-[11px] text-muted-foreground">
                  {[r.page, r.locale].filter(Boolean).join("  ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {tallies.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            {t("admin.votes")}
          </h2>
          <ul className="space-y-1.5">
            {tallies.map((v) => (
              <li
                key={v.lineId}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <Portrait id={v.lineId} name={v.lineName} size="sm" className="h-7 w-7" />
                <span className="flex-1 truncate">{v.lineName}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {v.accurate} {t("admin.accurate")} / {v.inaccurate} {t("admin.inaccurate")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
