import { serviceClient } from "@/lib/supabase/server";
import { collator, type Stats, type UnitClass } from "@/lib/queries";
import { UNIT_ID_RE } from "@/lib/unit-id";

/**
 * Catalog reads for the admin editor. Only import this from app/[locale]/admin/** and
 * app/api/admin/**.
 *
 * Separate from lib/queries.ts on purpose: that one is the public path, goes through the
 * anon client under RLS, and every page imports it. The editor needs data_id,
 * counter.source and *both* locales of unit_name at once, none of which the shared SELECT
 * carries, and it runs as the service role.
 */

export type AdminTier = {
  id: string;
  tier: number;
  dataId: number | null;
  stats: Stats | null;
  nameEn: string;
  nameEs: string;
};

export type AdminEdge = {
  lineId: string;
  source: string;
  reasonEn: string | null;
  reasonEs: string | null;
};

export type AdminLine = {
  id: string;
  civ: string | null;
  unitClass: UnitClass;
  isUnique: boolean;
  sortOrder: number;
  /** Lowest tier first. */
  tiers: AdminTier[];
  /** Rows where counter.line_id is this line: the other one beats it. */
  counteredBy: AdminEdge[];
  /** Rows where counter.counter_line_id is this line: this one beats the other. */
  strongAgainst: AdminEdge[];
};

/** One row of the browse table. */
export type AdminLineRow = {
  id: string;
  name: string;
  nameEn: string;
  nameEs: string;
  civ: string | null;
  unitClass: UnitClass;
  isUnique: boolean;
  tierCount: number;
  counteredByCount: number;
  strongAgainstCount: number;
  hasStats: boolean;
  /** Every tier name in both locales, so rank() matches "Paladin" and "Caballero" alike. */
  units: { name: string }[];
};

type NameRow = { locale: string; name: string };
type UnitRow = {
  id: string;
  tier: number;
  data_id?: number | null;
  stats: Stats | null;
  unit_name: NameRow[];
};

const pickName = (rows: NameRow[], locale: string) =>
  rows.find((r) => r.locale === locale)?.name ?? "";

const LIST_SELECT = `
  id, civ_id, is_unique, unit_class, sort_order,
  unit ( id, tier, stats, unit_name ( locale, name ) )
`;

export async function getAdminLines(locale: string): Promise<AdminLineRow[]> {
  const db = serviceClient();

  // Counting the two directions with an aliased embed fights PostgREST's disambiguation,
  // so the 900-odd edge rows come down raw and get tallied here. One extra round trip.
  const [{ data, error }, { data: edges }] = await Promise.all([
    db.from("unit_line").select(LIST_SELECT),
    db.from("counter").select("line_id, counter_line_id"),
  ]);
  if (error) throw error;

  const beaten = new Map<string, number>();
  const beats = new Map<string, number>();
  for (const e of edges ?? []) {
    beaten.set(e.line_id, (beaten.get(e.line_id) ?? 0) + 1);
    beats.set(e.counter_line_id, (beats.get(e.counter_line_id) ?? 0) + 1);
  }

  const cmp = collator(locale);
  return (data as unknown as { id: string; civ_id: string | null; is_unique: boolean; unit_class: UnitClass; sort_order: number; unit: UnitRow[] }[])
    .map((row) => {
      const tiers = [...row.unit].sort((a, b) => a.tier - b.tier);
      const base = tiers[0];
      return {
        id: row.id,
        // The line is named after its base tier, same rule as the public site.
        name: base ? pickName(base.unit_name, locale) || row.id : row.id,
        nameEn: base ? pickName(base.unit_name, "en") : "",
        nameEs: base ? pickName(base.unit_name, "es") : "",
        civ: row.civ_id,
        unitClass: row.unit_class,
        isUnique: row.is_unique,
        tierCount: tiers.length,
        counteredByCount: beaten.get(row.id) ?? 0,
        strongAgainstCount: beats.get(row.id) ?? 0,
        hasStats: tiers.some((t) => t.stats !== null),
        units: tiers.flatMap((t) => t.unit_name.map((n) => ({ name: n.name }))),
      };
    })
    .sort((a, b) => cmp.compare(a.name, b.name));
}

export async function getLineForAdmin(id: string): Promise<AdminLine | null> {
  // Not cosmetic: id is interpolated into the .or() filter below, and a comma or a
  // parenthesis in there lets a caller inject extra PostgREST filters.
  if (!UNIT_ID_RE.test(id)) return null;

  const db = serviceClient();
  const [{ data: line }, { data: edges }] = await Promise.all([
    db
      .from("unit_line")
      .select(
        `id, civ_id, is_unique, unit_class, sort_order,
         unit ( id, tier, data_id, stats, unit_name ( locale, name ) )`
      )
      .eq("id", id)
      .maybeSingle(),
    db
      .from("counter")
      .select("line_id, counter_line_id, source, reason_en, reason_es")
      .or(`line_id.eq.${id},counter_line_id.eq.${id}`),
  ]);

  if (!line) return null;
  const row = line as unknown as {
    id: string;
    civ_id: string | null;
    is_unique: boolean;
    unit_class: UnitClass;
    sort_order: number;
    unit: UnitRow[];
  };

  const edge = (lineId: string, e: { source: string; reason_en: string | null; reason_es: string | null }): AdminEdge => ({
    lineId,
    source: e.source,
    reasonEn: e.reason_en,
    reasonEs: e.reason_es,
  });

  return {
    id: row.id,
    civ: row.civ_id,
    unitClass: row.unit_class,
    isUnique: row.is_unique,
    sortOrder: row.sort_order,
    tiers: [...row.unit]
      .sort((a, b) => a.tier - b.tier)
      .map((u) => ({
        id: u.id,
        tier: u.tier,
        dataId: u.data_id ?? null,
        stats: u.stats,
        nameEn: pickName(u.unit_name, "en"),
        nameEs: pickName(u.unit_name, "es"),
      })),
    counteredBy: (edges ?? [])
      .filter((e) => e.line_id === id)
      .map((e) => edge(e.counter_line_id, e)),
    strongAgainst: (edges ?? [])
      .filter((e) => e.counter_line_id === id)
      .map((e) => edge(e.line_id, e)),
  };
}
