import type { Stats } from "@/lib/queries";

/**
 * Single source of truth for which stat fields exist, so the unit page, the correction
 * form and the API validator can never drift apart. `key` is the i18n key under `unit.`.
 */
export const STAT_FIELDS = [
  { name: "hp", key: "hp", min: 0, max: 2000, step: 1 },
  { name: "attack", key: "attack", min: 0, max: 500, step: 1 },
  { name: "meleeArmor", key: "meleeArmor", min: -10, max: 300, step: 1 },
  { name: "pierceArmor", key: "pierceArmor", min: -10, max: 300, step: 1 },
  { name: "range", key: "range", min: 0, max: 30, step: 0.5 },
  { name: "speed", key: "speed", min: 0, max: 5, step: 0.05 },
] as const;

/** `icon` names a lucide export; resolved in unit-stats.tsx so this file stays UI-free. */
export const COST_FIELDS = [
  { name: "Food", key: "food", icon: "Wheat" },
  { name: "Wood", key: "wood", icon: "TreePine" },
  { name: "Gold", key: "gold", icon: "Coins" },
  { name: "Stone", key: "stone", icon: "Gem" },
] as const;

export type StatFieldName = (typeof STAT_FIELDS)[number]["name"];
export type CostFieldName = (typeof COST_FIELDS)[number]["name"];

/** Flat shape the form works with: "hp" | "attack" | ... | "cost.Food". */
export type FlatStats = Record<string, number>;

export function toFlat(stats: Stats | null | undefined): FlatStats {
  const out: FlatStats = {};
  if (!stats) return out;
  for (const f of STAT_FIELDS) {
    const v = stats[f.name];
    if (typeof v === "number") out[f.name] = v;
  }
  for (const c of COST_FIELDS) {
    const v = stats.cost?.[c.name];
    if (typeof v === "number") out[`cost.${c.name}`] = v;
  }
  return out;
}

/**
 * Validates and nests a flat payload. Unknown keys, non-finite numbers and
 * out-of-range values are dropped rather than trusted, since this runs on user input.
 */
export function fromFlat(flat: unknown): Partial<Stats> | null {
  if (!flat || typeof flat !== "object") return null;
  const input = flat as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  const cost: Record<string, number> = {};

  for (const f of STAT_FIELDS) {
    const v = input[f.name];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    if (v < f.min || v > f.max) continue;
    out[f.name] = v;
  }

  for (const c of COST_FIELDS) {
    const v = input[`cost.${c.name}`];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    if (v < 0 || v > 2000) continue;
    cost[c.name] = v;
  }

  if (Object.keys(cost).length > 0) out.cost = cost;
  return Object.keys(out).length > 0 ? (out as Partial<Stats>) : null;
}

/** Only the entries the user actually changed, so approving merges a minimal diff. */
export function changedOnly(current: FlatStats, next: FlatStats): FlatStats {
  const out: FlatStats = {};
  for (const [k, v] of Object.entries(next)) {
    if (current[k] !== v) out[k] = v;
  }
  return out;
}
