"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { Portrait } from "@/components/portrait";
import { StatsEditor } from "@/components/stats-editor";
import { rank } from "@/lib/search/rank";
import type { FlatStats } from "@/lib/stats-fields";
import type { LineSummary, UnitClass } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { inputClass } from "@/lib/ui";

const CLASSES: UnitClass[] = [
  "Infantry",
  "Archer",
  "Cavalry",
  "CavalryArcher",
  "Siege",
  "Naval",
  "Monk",
  "Other",
];

/** Propose a unit the catalog does not have yet, with its class, civ, stats and counters. */
export function NewUnitForm({ lines, civs }: { lines: LineSummary[]; civs: string[] }) {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [civ, setCiv] = useState("");
  const [unitClass, setUnitClass] = useState<UnitClass>("Infantry");
  const [isUnique, setIsUnique] = useState(false);
  const [stats, setStats] = useState<FlatStats>({});
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const options = rank(query, lines).slice(0, 24);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setMessage(t("newUnit.nameRequired"));
      setState("error");
      return;
    }
    setState("sending");
    setMessage("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "new-unit",
          name: name.trim(),
          civ: civ || null,
          unitClass,
          isUnique,
          stats,
          counters: picked,
          comment,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setMessage(t("newUnit.sent"));
      setState("sent");
    } catch {
      setMessage(t("feedback.error"));
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-border bg-card p-5 text-sm font-medium">
        <Check className="h-4 w-4 text-primary" strokeWidth={2} />
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nu-name" className="mb-1.5 block text-sm font-medium">
            {t("newUnit.nameLabel")}
          </label>
          <input
            id="nu-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
            placeholder={t("newUnit.namePlaceholder")}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="nu-class" className="mb-1.5 block text-sm font-medium">
            {t("newUnit.classLabel")}
          </label>
          <select
            id="nu-class"
            value={unitClass}
            onChange={(e) => setUnitClass(e.target.value as UnitClass)}
            className={inputClass}
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {t(`class.${c}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="nu-civ" className="mb-1.5 block text-sm font-medium">
            {t("newUnit.civLabel")}
          </label>
          <select
            id="nu-civ"
            value={civ}
            onChange={(e) => setCiv(e.target.value)}
            className={inputClass}
          >
            <option value="">{t("newUnit.noCiv")}</option>
            {civs.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={isUnique}
              onChange={(e) => setIsUnique(e.target.checked)}
              className="h-4 w-4 accent-[var(--primary)]"
            />
            {t("newUnit.uniqueLabel")}
          </label>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="mb-1 text-sm font-medium">{t("newUnit.statsTitle")}</p>
        <p className="mb-4 text-xs text-muted-foreground">{t("newUnit.statsHelp")}</p>
        <StatsEditor current={{}} value={stats} onChange={setStats} />
      </div>

      <div className="border-t border-border pt-5">
        <label htmlFor="nu-search" className="mb-1.5 block text-sm font-medium">
          {t("newUnit.countersLabel")}
        </label>
        <input
          id="nu-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("browse.filterPlaceholder")}
          className={cn(inputClass, "mb-3")}
        />
        <ul className="grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
          {options.map((line) => {
            const on = picked.includes(line.id);
            return (
              <li key={line.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 transition-colors",
                    on ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() =>
                      setPicked((p) => (on ? p.filter((x) => x !== line.id) : [...p, line.id]))
                    }
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <Portrait id={line.id} name={line.name} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm">{line.name}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <label htmlFor="nu-comment" className="mb-1.5 block text-sm text-muted-foreground">
          {t("feedback.commentLabel")}
        </label>
        <textarea
          id="nu-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder={t("newUnit.commentPlaceholder")}
          className={inputClass}
        />
      </div>

      {message && state === "error" && <p className="text-sm text-destructive">{message}</p>}

      <button
        type="submit"
        disabled={state === "sending"}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5",
          "text-sm font-medium text-primary-foreground transition-opacity",
          "hover:opacity-90 active:scale-[0.98] disabled:opacity-60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
      >
        {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
        {state === "sending" ? t("feedback.sending") : t("newUnit.submit")}
      </button>
    </form>
  );
}
