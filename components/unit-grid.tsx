"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Portrait } from "@/components/portrait";
import { CivBadge } from "@/components/civ-badge";
import { rank } from "@/lib/search/rank";
import type { LineSummary, UnitClass } from "@/lib/queries";
import { cn } from "@/lib/utils";

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

export function UnitGrid({
  lines,
  civs,
  showFilters = true,
}: {
  lines: LineSummary[];
  civs: string[];
  showFilters?: boolean;
}) {
  const t = useTranslations();
  const reduce = useReducedMotion();
  const searchParams = useSearchParams();
  const [unitClass, setUnitClass] = useState<UnitClass | null>(null);
  // Seeded from ?civ= so the civilization carousel can deep-link here. Read on the
  // client so this page stays statically rendered.
  const [civ, setCiv] = useState<string | null>(() => {
    const c = searchParams.get("civ");
    return c && civs.includes(c) ? c : null;
  });
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    let out = lines;
    if (unitClass) out = out.filter((l) => l.unitClass === unitClass);
    if (civ) out = out.filter((l) => l.civ === civ);
    return rank(query, out);
  }, [lines, unitClass, civ, query]);

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-sm transition-colors active:scale-[0.97]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
    );

  return (
    <div>
      {showFilters && (
        <div className="mb-8 space-y-4">
          <div>
            <label
              htmlFor="grid-filter"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              {t("browse.filterLabel")}
            </label>
            <input
              id="grid-filter"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("browse.filterPlaceholder")}
              className={cn(
                "w-full max-w-sm rounded-lg border border-input bg-card px-3 py-2",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setUnitClass(null)}
              className={chip(unitClass === null)}
            >
              {t("browse.all")}
            </button>
            {CLASSES.map((c) => (
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

          <div>
            <label htmlFor="grid-civ" className="sr-only">
              {t("browse.civLabel")}
            </label>
            <select
              id="grid-civ"
              value={civ ?? ""}
              onChange={(e) => setCiv(e.target.value || null)}
              className={cn(
                "rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              <option value="">{t("browse.allCivs")}</option>
              {civs.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <p className="font-mono text-xs text-muted-foreground">
            {civ
              ? t("browse.countCiv", { count: shown.length, civ })
              : t("browse.count", { count: shown.length, total: lines.length })}
          </p>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-medium text-foreground">{t("browse.emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("browse.emptyBody")}</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setUnitClass(null);
              setCiv(null);
            }}
            className="mt-4 rounded-full border border-border px-4 py-2 text-sm hover:border-primary/50"
          >
            {t("browse.reset")}
          </button>
        </div>
      ) : (
        /*
         * The art is the tile. The old layout boxed every line in an identical card with a
         * 56px thumbnail, so 111 rows read as one undifferentiated list and the portraits
         * (the only thing that tells two units apart at a glance) were the smallest element
         * on screen. No card chrome now: the portrait fills its column, the label sits on
         * the page background, and the only overlay is the counter count, which is what
         * this site is for.
         */
        <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
          {shown.map((line) => (
            <motion.li
              key={line.id}
              // layout animates the reflow when filters change, so a tile the user is
              // tracking visibly moves instead of teleporting.
              layout={!reduce}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={`/unit/${line.id.toLowerCase()}`}
                className="group block focus-visible:outline-none"
              >
                <Portrait
                  id={line.id}
                  name={line.name}
                  size="tile"
                  className={cn(
                    "transition-shadow",
                    "group-hover:ring-2 group-hover:ring-primary",
                    "group-focus-visible:ring-2 group-focus-visible:ring-ring"
                  )}
                />

                <span className="mt-2 block line-clamp-2 text-[13px] font-medium leading-tight group-hover:text-primary">
                  {line.name}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  {line.civ && <CivBadge civ={line.civ} size={12} />}
                  <span className="truncate">
                    {line.civ ?? t(`class.${line.unitClass}`)}
                  </span>
                  <span className="ml-auto font-mono tabular-nums">
                    {line.counterCount}
                    <span className="sr-only">
                      {" "}
                      {t("browse.counters", { count: line.counterCount })}
                    </span>
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
