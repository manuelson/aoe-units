"use client";

import { useTranslations } from "next-intl";
import { STAT_FIELDS, COST_FIELDS, type FlatStats } from "@/lib/stats-fields";
import { cn } from "@/lib/utils";

/**
 * Number inputs prefilled with the current values. Editing one marks it changed;
 * only changed fields are submitted, so approving merges a minimal diff.
 */
export function StatsEditor({
  current,
  value,
  onChange,
}: {
  current: FlatStats;
  value: FlatStats;
  onChange: (next: FlatStats) => void;
}) {
  const t = useTranslations();

  const set = (name: string, raw: string) => {
    const next = { ...value };
    if (raw === "") delete next[name];
    else {
      const n = Number(raw);
      if (Number.isFinite(n)) next[name] = n;
    }
    onChange(next);
  };

  const field = (
    name: string,
    label: string,
    opts?: { min?: number; max?: number; step?: number }
  ) => {
    const changed = value[name] !== undefined && value[name] !== current[name];
    return (
      <div key={name}>
        <label
          htmlFor={`stat-${name}`}
          className="mb-1 block text-xs text-muted-foreground"
        >
          {label}
        </label>
        <input
          id={`stat-${name}`}
          type="number"
          inputMode="decimal"
          min={opts?.min}
          max={opts?.max}
          step={opts?.step ?? 1}
          value={value[name] ?? ""}
          onChange={(e) => set(name, e.target.value)}
          className={cn(
            "w-full rounded-lg border bg-background px-2.5 py-1.5 font-mono text-sm tabular-nums",
            "text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            changed ? "border-primary" : "border-input"
          )}
        />
        {changed && (
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {current[name] ?? "-"} → {value[name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STAT_FIELDS.map((f) =>
          field(f.name, t(`unit.${f.key}`), { min: f.min, max: f.max, step: f.step })
        )}
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">{t("unit.cost")}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COST_FIELDS.map((c) =>
            field(`cost.${c.name}`, t(`unit.${c.key}`), { min: 0, max: 2000 })
          )}
        </div>
      </div>
    </div>
  );
}
