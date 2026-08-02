import { getTranslations } from "next-intl/server";
import { serviceClient } from "@/lib/supabase/server";
import { getLines } from "@/lib/queries";
import { STAT_FIELDS, COST_FIELDS } from "@/lib/stats-fields";
import {
  Queue,
  type Pending,
  type PendingStat,
  type PendingUnit,
  type PendingReport,
  type VoteTally,
} from "./admin-client";

export async function QueueData({ locale }: { locale: string }) {
  const db = serviceClient();
  const [lines, t] = await Promise.all([getLines(locale), getTranslations({ locale })]);
  const nameOfLine = new Map(lines.map((l) => [l.id, l.name]));
  const nameOfUnit = new Map(lines.flatMap((l) => l.units.map((u) => [u.id, u.name])));

  const [
    { data: suggestions },
    { data: statRows },
    { data: unitRows },
    { data: reportRows },
    { data: votes },
  ] = await Promise.all([
    db
      .from("counter_suggestion")
      .select("id, line_id, suggested_line_id, free_text, comment, action")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(200),
    db
      .from("stat_suggestion")
      .select("id, unit_id, stats, comment")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(200),
    db
      .from("unit_suggestion")
      .select("id, name, civ_id, unit_class, is_unique, stats, counters, comment")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(200),
    db
      .from("site_report")
      .select("id, message, page, locale, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(200),
    db.from("counter_vote").select("line_id, is_accurate").limit(5000),
  ]);

  const pending: Pending[] = (suggestions ?? []).map((s) => ({
    id: s.id,
    lineId: s.line_id,
    lineName: nameOfLine.get(s.line_id) ?? s.line_id,
    suggestedId: s.suggested_line_id,
    suggestedName: s.suggested_line_id
      ? (nameOfLine.get(s.suggested_line_id) ?? s.suggested_line_id)
      : null,
    freeText: s.free_text,
    comment: s.comment,
    action: s.action as "add" | "remove",
  }));

  // Current values come from the live unit rows so the reviewer sees a real before/after,
  // not just the proposed number.
  const statUnitIds = [...new Set((statRows ?? []).map((r) => r.unit_id))];
  const { data: currentUnits } = statUnitIds.length
    ? await db.from("unit").select("id, line_id, stats").in("id", statUnitIds)
    : { data: [] };
  const currentOf = new Map((currentUnits ?? []).map((u) => [u.id, u.stats ?? {}]));
  const lineOfUnit = new Map((currentUnits ?? []).map((u) => [u.id, u.line_id]));

  const labelOf = (name: string) => {
    const stat = STAT_FIELDS.find((f) => f.name === name);
    if (stat) return t(`unit.${stat.key}`);
    const cost = COST_FIELDS.find((c) => c.name === name);
    return cost ? t(`unit.${cost.key}`) : name;
  };

  const stats: PendingStat[] = (statRows ?? []).map((s) => {
    const cur = (currentOf.get(s.unit_id) ?? {}) as Record<string, unknown> & {
      cost?: Record<string, number>;
    };
    const proposed = (s.stats ?? {}) as Record<string, unknown> & {
      cost?: Record<string, number>;
    };
    const changes: [string, string, string][] = [];

    for (const [k, v] of Object.entries(proposed)) {
      if (k === "cost") continue;
      changes.push([labelOf(k), String(cur[k] ?? "-"), String(v)]);
    }
    for (const [k, v] of Object.entries(proposed.cost ?? {})) {
      changes.push([labelOf(k), String(cur.cost?.[k] ?? "-"), String(v)]);
    }

    return {
      id: s.id,
      unitId: s.unit_id,
      lineId: lineOfUnit.get(s.unit_id) ?? s.unit_id,
      unitName: nameOfUnit.get(s.unit_id) ?? s.unit_id,
      changes,
      comment: s.comment,
    };
  });

  const units: PendingUnit[] = (unitRows ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    civ: u.civ_id,
    unitClass: u.unit_class,
    isUnique: u.is_unique,
    counters: (u.counters ?? []).map((c: string) => nameOfLine.get(c) ?? c),
    statCount: Object.keys((u.stats ?? {}) as object).length,
    comment: u.comment,
  }));

  const reports: PendingReport[] = (reportRows ?? []).map((r) => ({
    id: r.id,
    message: r.message,
    page: r.page,
    locale: r.locale,
    createdAt: r.created_at,
  }));

  // Aggregate in JS: a few thousand rows, and it avoids adding a view for one screen.
  const counts = new Map<string, { accurate: number; inaccurate: number }>();
  for (const v of votes ?? []) {
    const c = counts.get(v.line_id) ?? { accurate: 0, inaccurate: 0 };
    if (v.is_accurate) c.accurate++;
    else c.inaccurate++;
    counts.set(v.line_id, c);
  }

  const tallies: VoteTally[] = [...counts.entries()]
    .map(([lineId, c]) => ({ lineId, lineName: nameOfLine.get(lineId) ?? lineId, ...c }))
    // Most-disputed first: that is where a moderator's attention is worth most.
    .sort((a, b) => b.inaccurate - a.inaccurate || b.accurate - a.accurate)
    .slice(0, 30);

  return (
    <Queue
      pending={pending}
      stats={stats}
      units={units}
      reports={reports}
      tallies={tallies}
    />
  );
}
