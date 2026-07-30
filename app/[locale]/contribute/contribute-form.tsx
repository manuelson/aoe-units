"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CounterFeedback } from "@/components/counter-feedback";
import { Portrait } from "@/components/portrait";
import { NewUnitForm } from "./new-unit-form";
import { ReportForm } from "./report-form";
import type { LineSummary } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Tab = "counter" | "unit" | "report";

/**
 * Two jobs behind one heading: add a counter to a unit that already exists, or propose
 * a unit the catalog is missing entirely.
 */
export function ContributeForm({
  lines,
  civs,
}: {
  lines: LineSummary[];
  civs: string[];
}) {
  const t = useTranslations();
  const [tab, setTab] = useState<Tab>("counter");
  const [id, setId] = useState("");
  const selected = lines.find((l) => l.id === id);

  const tabClass = (active: boolean) =>
    cn(
      "rounded-full border px-4 py-2 text-sm transition-colors active:scale-[0.97]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
    );

  return (
    <div className="space-y-8">
      <div role="tablist" className="flex flex-wrap gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "counter"}
          onClick={() => setTab("counter")}
          className={tabClass(tab === "counter")}
        >
          {t("contribute.tabCounter")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "unit"}
          onClick={() => setTab("unit")}
          className={tabClass(tab === "unit")}
        >
          {t("contribute.tabUnit")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "report"}
          onClick={() => setTab("report")}
          className={tabClass(tab === "report")}
        >
          {t("contribute.tabReport")}
        </button>
      </div>

      {tab === "counter" ? (
        <div className="space-y-8">
          <div>
            <label htmlFor="contribute-unit" className="mb-1.5 block text-sm font-medium">
              {t("contribute.unitLabel")}
            </label>
            <div className="flex items-center gap-3">
              {selected && <Portrait id={selected.id} name={selected.name} size="md" />}
              <select
                id="contribute-unit"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className={cn(
                  "w-full max-w-sm rounded-lg border border-input bg-card px-3 py-2.5 text-sm",
                  "text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <option value="">{t("contribute.unitPlaceholder")}</option>
                {lines.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {l.civ ? ` (${l.civ})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selected && (
            <CounterFeedback
              // Remounting on change resets the picked list when the user switches unit.
              key={selected.id}
              lineId={selected.id}
              lineName={selected.name}
              allLines={lines}
              listed={[]}
              mode="suggest"
            />
          )}
        </div>
      ) : tab === "unit" ? (
        <NewUnitForm lines={lines} civs={civs} />
      ) : (
        <ReportForm />
      )}
    </div>
  );
}
