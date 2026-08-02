"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ExternalLink, Loader2, Plus, Trash2, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Portrait } from "@/components/portrait";
import { StatsEditor } from "@/components/stats-editor";
import { CLASS_ORDER, type UnitClass } from "@/lib/queries";
import { toFlat, type FlatStats } from "@/lib/stats-fields";
import { toPascalId } from "@/lib/unit-id";
import type { AdminEdge, AdminLine, AdminLineRow } from "@/lib/admin-queries";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";
import { CounterEditor } from "./counter-editor";

type TierDraft = {
  id: string;
  /** False for tiers added in this session: their id is still free to choose. */
  existing: boolean;
  dataId: string;
  nameEn: string;
  nameEs: string;
  stats: FlatStats;
};

type Draft = {
  civ: string;
  unitClass: UnitClass;
  isUnique: boolean;
  tiers: TierDraft[];
  counteredBy: AdminEdge[];
  strongAgainst: AdminEdge[];
};

const toDraft = (line: AdminLine): Draft => ({
  civ: line.civ ?? "",
  unitClass: line.unitClass,
  isUnique: line.isUnique,
  tiers: line.tiers.map((t) => ({
    id: t.id,
    existing: true,
    dataId: t.dataId === null ? "" : String(t.dataId),
    nameEn: t.nameEn,
    nameEs: t.nameEs,
    stats: toFlat(t.stats),
  })),
  counteredBy: line.counteredBy,
  strongAgainst: line.strongAgainst,
});

export function UnitEditor({
  line,
  lines,
  civs,
}: {
  line: AdminLine;
  lines: AdminLineRow[];
  civs: string[];
}) {
  const t = useTranslations();
  const router = useRouter();

  const [draft, setDraft] = useState<Draft>(() => toDraft(line));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  // Snapshot rather than a form library: the payload is small enough that a deep compare
  // on every keystroke is cheaper than the dependency. State, not a ref, because the save
  // bar has to re-render the moment it moves.
  const [saved, setSaved] = useState(() => JSON.stringify(toDraft(line)));
  const dirty = JSON.stringify(draft) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const patchTier = (i: number, patch: Partial<TierDraft>) =>
    setDraft((d) => ({
      ...d,
      tiers: d.tiers.map((tier, j) => (j === i ? { ...tier, ...patch } : tier)),
    }));

  const baseName = line.tiers[0]?.nameEs ?? line.id;

  async function save() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/unit", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: line.id,
        civ: draft.civ || null,
        unitClass: draft.unitClass,
        isUnique: draft.isUnique,
        tiers: draft.tiers.map((tier) => ({
          id: tier.id,
          dataId: tier.dataId,
          nameEn: tier.nameEn,
          nameEs: tier.nameEs,
          stats: tier.stats,
        })),
        counteredBy: draft.counteredBy,
        strongAgainst: draft.strongAgainst,
      }),
    });
    setSaving(false);

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError([json.field, json.error].filter(Boolean).join(": ") || t("admin.saveError"));
      return;
    }
    const next = { ...draft, tiers: draft.tiers.map((tier) => ({ ...tier, existing: true })) };
    setDraft(next);
    setSaved(JSON.stringify(next));
    router.refresh();
  }

  async function remove() {
    setSaving(true);
    const res = await fetch("/api/admin/unit", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: line.id }),
    });
    if (!res.ok) {
      setSaving(false);
      setError(t("admin.saveError"));
      return;
    }
    setSaved(JSON.stringify(draft)); // stops beforeunload firing on the way out
    router.push("/admin/units");
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
        <Link
          href="/admin/units"
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          {t("admin.backToUnits")}
        </Link>
        <Link
          href={`/unit/${line.id.toLowerCase()}`}
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
          {t("admin.viewOnSite")}
        </Link>
      </div>

      <header className="mb-8 flex items-center gap-4">
        <Portrait id={line.id} name={baseName} size="xl" className="h-20 w-20" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{baseName}</h1>
          <p className="font-mono text-sm text-muted-foreground">{line.id}</p>
        </div>
      </header>

      {/* ------------------------------------------------------------------- identity */}
      <section className="border-t border-border pt-6">
        <h2 className="mb-3 text-sm font-medium">{t("admin.identity")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs text-muted-foreground">
              {t("newUnit.classLabel")}
            </span>
            <select
              value={draft.unitClass}
              onChange={(e) => set("unitClass", e.target.value as UnitClass)}
              className={inputClass}
            >
              {CLASS_ORDER.map((c) => (
                <option key={c} value={c}>
                  {t(`class.${c}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-muted-foreground">
              {t("newUnit.civLabel")}
            </span>
            <select
              value={draft.civ}
              onChange={(e) => set("civ", e.target.value)}
              className={inputClass}
            >
              <option value="">{t("newUnit.noCiv")}</option>
              {civs.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.isUnique}
              onChange={(e) => set("isUnique", e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            {t("newUnit.uniqueLabel")}
          </label>
        </div>
      </section>

      {/* ---------------------------------------------------------------------- tiers */}
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="mb-3 text-sm font-medium">{t("admin.tiers")}</h2>

        <ul className="space-y-5">
          {draft.tiers.map((tier, i) => (
            <li key={i} className="border-l-2 border-border pl-4">
              <div className="flex items-start gap-3">
                <Portrait id={tier.id} name={tier.nameEs || tier.id} size="lg" className="h-12 w-12" />
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-[11px] text-muted-foreground">
                        {t("admin.nameEs")}
                      </span>
                      <input
                        value={tier.nameEs}
                        onChange={(e) => patchTier(i, { nameEs: e.target.value })}
                        maxLength={80}
                        className={cn(inputClass, "py-1.5")}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] text-muted-foreground">
                        {t("admin.nameEn")}
                      </span>
                      <input
                        value={tier.nameEn}
                        onChange={(e) =>
                          patchTier(i, {
                            nameEn: e.target.value,
                            // A brand new tier gets its id from the English name until
                            // it is saved; after that the id is frozen.
                            ...(tier.existing ? {} : { id: toPascalId(e.target.value) }),
                          })
                        }
                        maxLength={80}
                        className={cn(inputClass, "py-1.5")}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] text-muted-foreground">
                        {t("admin.tierId")}
                      </span>
                      <input
                        value={tier.id}
                        onChange={(e) => patchTier(i, { id: e.target.value })}
                        disabled={tier.existing}
                        title={tier.existing ? t("admin.tierIdLocked") : undefined}
                        className={cn(inputClass, "py-1.5 font-mono disabled:opacity-60")}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] text-muted-foreground">
                        {t("admin.dataId")}
                      </span>
                      <input
                        value={tier.dataId}
                        onChange={(e) => patchTier(i, { dataId: e.target.value })}
                        inputMode="numeric"
                        className={cn(inputClass, "py-1.5 font-mono")}
                      />
                    </label>
                  </div>

                  <details className="group">
                    <summary className="cursor-pointer list-none text-xs text-muted-foreground hover:text-foreground">
                      {t("admin.editStats")} ▸
                    </summary>
                    <div className="mt-3">
                      {/* current vs value is exactly "saved vs unsaved" here, which is
                          what StatsEditor already draws. Used untouched. */}
                      <StatsEditor
                        current={toFlat(line.tiers.find((x) => x.id === tier.id)?.stats ?? null)}
                        value={tier.stats}
                        onChange={(next) => patchTier(i, { stats: next })}
                      />
                    </div>
                  </details>
                </div>

                {draft.tiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => set("tiers", draft.tiers.filter((_, j) => j !== i))}
                    aria-label={t("admin.removeTier")}
                    className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {draft.tiers.length < 8 && (
          <button
            type="button"
            onClick={() =>
              set("tiers", [
                ...draft.tiers,
                { id: "", existing: false, dataId: "", nameEn: "", nameEs: "", stats: {} },
              ])
            }
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            {t("admin.addTier")}
          </button>
        )}
      </section>

      {/* ------------------------------------------------------------------- counters */}
      <div className="mt-8 space-y-8">
        {/* counteredBy = rows where counter.line_id is this line: the other one wins. */}
        <CounterEditor
          title={t("unit.counters")}
          help={t("unit.countersHelp")}
          selfId={line.id}
          edges={draft.counteredBy}
          lines={lines}
          onChange={(next) => set("counteredBy", next)}
        />
        <CounterEditor
          title={t("unit.strongAgainst")}
          help={t("unit.strongAgainstHelp")}
          selfId={line.id}
          edges={draft.strongAgainst}
          lines={lines}
          onChange={(next) => set("strongAgainst", next)}
        />
      </div>

      {/* ------------------------------------------------------------------ save bar */}
      <div className="sticky bottom-0 -mx-4 mt-10 border-t border-border bg-background/85 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? t("admin.saving") : t("admin.save")}
          </button>
          {dirty && (
            <span className="text-xs text-muted-foreground">{t("admin.unsaved")}</span>
          )}
          {error && <span className="text-xs text-destructive">{error}</span>}

          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t("admin.deleteUnit")}
          </button>
        </div>
      </div>

      {confirming && (
        <DeleteDialog
          line={line}
          name={baseName}
          busy={saving}
          onCancel={() => setConfirming(false)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

function DeleteDialog({
  line,
  name,
  busy,
  onCancel,
  onConfirm,
}: {
  line: AdminLine;
  name: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations();
  const [typed, setTyped] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal
        className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-2xl"
      >
        <h2 className="text-base font-semibold">{t("admin.deleteTitle", { name })}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.deleteBody", {
            tiers: line.tiers.length,
            counters: line.counteredBy.length + line.strongAgainst.length,
          })}
        </p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs text-muted-foreground">
            {t("admin.deleteConfirm", { id: line.id })}
          </span>
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className={cn(inputClass, "font-mono")}
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("feedback.back")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={typed !== line.id || busy}
            className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("admin.deleteUnit")}
          </button>
        </div>
      </div>
    </div>
  );
}
