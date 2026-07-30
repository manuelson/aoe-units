import { getTranslations } from "next-intl/server";
import { Wheat, TreePine, Coins, Gem } from "lucide-react";
import { STAT_FIELDS, COST_FIELDS } from "@/lib/stats-fields";
import type { Stats, StatMaxima } from "@/lib/queries";

const COST_ICONS = { Wheat, TreePine, Coins, Gem } as const;

/**
 * One meter per stat rather than a bare number grid. A raw "160 HP" is unreadable
 * without a frame of reference, so each track is scaled to the strongest unit in the
 * game for that stat and the limit is stated next to it.
 *
 * Deliberately not a radar chart: these six measures have unrelated units (HP vs
 * tiles vs tiles-per-second), and a radar implies they share a scale.
 */
export async function UnitStats({
  stats,
  maxima,
}: {
  stats: Stats;
  maxima: StatMaxima;
}) {
  const t = await getTranslations();

  const rows = STAT_FIELDS.map((f) => {
    const value = stats[f.name];
    const max = maxima[f.name];
    if (typeof value !== "number" || !max) return null;
    // Armour on rams is a damage-immunity hack in the game data; the view already
    // excludes those, so clamp rather than draw a bar past the end of its track.
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return { label: t(`unit.${f.key}`), value, max, pct };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  const cost = COST_FIELDS.map((c) => ({
    label: t(`unit.${c.key}`),
    value: stats.cost?.[c.name],
    Icon: COST_ICONS[c.icon],
  })).filter(
    (c): c is { label: string; value: number; Icon: (typeof COST_ICONS)[keyof typeof COST_ICONS] } =>
      typeof c.value === "number" && c.value > 0
  );

  if (rows.length === 0 && cost.length === 0) return null;

  return (
    <div className="space-y-6">
      {rows.length > 0 && (
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm text-muted-foreground">{r.label}</dt>
                <dd className="font-mono text-sm tabular-nums">
                  {r.value}
                  <span className="text-muted-foreground"> / {r.max}</span>
                </dd>
              </div>
              {/* Track is a lighter step of the fill's own hue, so the pair reads as
                  one scale. role=img keeps it out of the a11y tree as decoration:
                  the dt/dd above already state the value. */}
              <div
                className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-chart-track"
                role="img"
                aria-label={`${r.label}: ${r.value} ${t("unit.outOf")} ${r.max}`}
              >
                <div
                  className="h-full rounded-full bg-chart-fill"
                  style={{ width: `${pctToWidth(r.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </dl>
      )}

      {cost.length > 0 && (
        <div className="border-t border-border pt-5">
          <p className="mb-2 text-xs text-muted-foreground">{t("unit.cost")}</p>
          {/* A handful of headline numbers is a stat row, not a chart. The icon is
              paired with its label, so identity never rests on the glyph alone. */}
          <dl className="flex flex-wrap gap-2.5">
            {cost.map(({ label, value, Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
              >
                <Icon
                  className="h-4 w-4 shrink-0 text-chart-fill"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <div>
                  <dt className="text-[11px] leading-none text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-mono text-base leading-none">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

/** A non-zero stat should never render as an invisible sliver. */
function pctToWidth(pct: number) {
  return pct > 0 ? Math.max(pct, 2) : 0;
}
