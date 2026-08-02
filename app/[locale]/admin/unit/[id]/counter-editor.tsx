"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Plus } from "lucide-react";
import { Portrait } from "@/components/portrait";
import { rank } from "@/lib/search/rank";
import type { AdminEdge, AdminLineRow } from "@/lib/admin-queries";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * One direction of the counter graph. Used twice, so the labels come in as props: getting
 * the direction backwards is the easiest mistake to make on this screen, and the two
 * blocks are otherwise identical.
 */
export function CounterEditor({
  title,
  help,
  selfId,
  edges,
  lines,
  onChange,
}: {
  title: string;
  help: string;
  selfId: string;
  edges: AdminEdge[];
  lines: AdminLineRow[];
  onChange: (next: AdminEdge[]) => void;
}) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState(false);

  const nameOf = useMemo(() => new Map(lines.map((l) => [l.id, l.name])), [lines]);
  const chosen = new Set(edges.map((e) => e.lineId));

  const options = useMemo(
    () => rank(query, lines.filter((l) => l.id !== selfId && !chosen.has(l.id))).slice(0, 24),
    // chosen is derived from edges, so edges is the real dependency.
    [query, lines, selfId, edges] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const patch = (lineId: string, field: "reasonEs" | "reasonEn", value: string) =>
    onChange(edges.map((e) => (e.lineId === lineId ? { ...e, [field]: value || null } : e)));

  return (
    <section className="border-t border-border pt-6">
      <h2 className="text-sm font-medium">
        {title}{" "}
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {edges.length}
        </span>
      </h2>
      <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{help}</p>

      <ul className="divide-y divide-border border-t border-border">
        {edges.map((e) => (
          <li key={e.lineId} className="flex flex-wrap items-center gap-2.5 py-2.5">
            <Portrait id={e.lineId} name={nameOf.get(e.lineId) ?? e.lineId} size="sm" className="h-8 w-8" />
            <span className="min-w-0 flex-1 truncate text-sm">
              {nameOf.get(e.lineId) ?? e.lineId}
            </span>
            <input
              value={e.reasonEs ?? ""}
              onChange={(ev) => patch(e.lineId, "reasonEs", ev.target.value)}
              maxLength={200}
              placeholder={t("admin.reasonEs")}
              aria-label={`${t("admin.reasonEs")} ${nameOf.get(e.lineId) ?? e.lineId}`}
              className={cn(inputClass, "w-full py-1 text-xs sm:w-56")}
            />
            <input
              value={e.reasonEn ?? ""}
              onChange={(ev) => patch(e.lineId, "reasonEn", ev.target.value)}
              maxLength={200}
              placeholder={t("admin.reasonEn")}
              aria-label={`${t("admin.reasonEn")} ${nameOf.get(e.lineId) ?? e.lineId}`}
              className={cn(inputClass, "w-full py-1 text-xs sm:w-56")}
            />
            <button
              type="button"
              onClick={() => onChange(edges.filter((x) => x.lineId !== e.lineId))}
              aria-label={`${t("admin.removeTier")} ${nameOf.get(e.lineId) ?? e.lineId}`}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </li>
        ))}
      </ul>

      {picking ? (
        <div className="mt-3">
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("browse.filterPlaceholder")}
            aria-label={t("admin.addCounter")}
            className={cn(inputClass, "max-w-sm")}
          />
          <ul className="mt-2 grid max-h-56 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
            {options.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange([...edges, { lineId: l.id, source: "community", reasonEn: null, reasonEs: null }]);
                    setQuery("");
                    setPicking(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Portrait id={l.id} name={l.name} size="sm" className="h-7 w-7" />
                  <span className="min-w-0 flex-1 truncate text-sm">{l.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          {t("admin.addCounter")}
        </button>
      )}
    </section>
  );
}
