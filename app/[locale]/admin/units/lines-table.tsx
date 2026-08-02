"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Portrait } from "@/components/portrait";
import { CivBadge } from "@/components/civ-badge";
import { rank } from "@/lib/search/rank";
import { CLASS_ORDER, type UnitClass } from "@/lib/queries";
import type { AdminLineRow } from "@/lib/admin-queries";
import { inputClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** Every line in the catalog, one row each, straight into the editor. */
export function LinesTable({ lines, civs }: { lines: AdminLineRow[]; civs: string[] }) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [unitClass, setUnitClass] = useState<UnitClass | null>(null);
  const [civ, setCiv] = useState<string | null>(null);

  const shown = useMemo(() => {
    let out = lines;
    if (unitClass) out = out.filter((l) => l.unitClass === unitClass);
    if (civ) out = out.filter((l) => l.civ === civ);
    // rank() sees every tier name in both locales, so "Paladin" and "Caballero" both hit.
    return rank(query, out);
  }, [lines, query, unitClass, civ]);

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-2.5 py-1 text-xs transition-colors active:scale-[0.97]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
    );

  return (
    <div>
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.search")}
            aria-label={t("admin.search")}
            className={cn(inputClass, "max-w-xs")}
          />
          <select
            value={civ ?? ""}
            onChange={(e) => setCiv(e.target.value || null)}
            aria-label={t("browse.civLabel")}
            className={cn(inputClass, "w-auto")}
          >
            <option value="">{t("browse.allCivs")}</option>
            {civs.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
            {t("admin.count", { count: shown.length, total: lines.length })}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => setUnitClass(null)} className={chip(unitClass === null)}>
            {t("browse.all")}
          </button>
          {CLASS_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setUnitClass(unitClass === c ? null : c)}
              className={chip(unitClass === c)}
            >
              {t(`class.${c}`)}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="border-y border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          {t("browse.emptyTitle")}
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 font-medium" colSpan={2}>
                {t("admin.colUnit")}
              </th>
              <th className="hidden py-2 font-medium sm:table-cell">{t("admin.colCiv")}</th>
              <th className="hidden py-2 font-medium md:table-cell">{t("admin.colClass")}</th>
              <th className="py-2 text-right font-medium">{t("admin.colTiers")}</th>
              <th className="py-2 text-right font-medium">{t("admin.colBeaten")}</th>
              <th className="py-2 text-right font-medium">{t("admin.colBeats")}</th>
              <th className="w-6" />
            </tr>
          </thead>
          <tbody>
            {shown.map((l) => (
              // relative + the stretched link: whole row clickable, no JS handler.
              <tr key={l.id} className="relative border-b border-border hover:bg-accent">
                <td className="w-10 py-2">
                  <Portrait id={l.id} name={l.name} size="sm" className="h-8 w-8" />
                </td>
                <td className="py-2 pl-3">
                  <Link
                    href={`/admin/unit/${l.id}`}
                    className="font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {l.name}
                  </Link>
                  <span className="block font-mono text-[11px] text-muted-foreground">
                    {l.id}
                    {l.isUnique && <span className="ml-1.5 text-primary">●</span>}
                  </span>
                </td>
                <td className="hidden py-2 sm:table-cell">
                  {l.civ ? (
                    <span className="inline-flex items-center gap-1.5 text-xs">
                      <CivBadge civ={l.civ} size={14} />
                      {l.civ}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="hidden py-2 text-xs text-muted-foreground md:table-cell">
                  {t(`class.${l.unitClass}`)}
                </td>
                <td className="py-2 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {l.tierCount}
                </td>
                <td className="py-2 text-right font-mono text-xs tabular-nums">
                  {l.counteredByCount}
                </td>
                <td className="py-2 text-right font-mono text-xs tabular-nums">
                  {l.strongAgainstCount}
                </td>
                <td className="py-2 pl-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
