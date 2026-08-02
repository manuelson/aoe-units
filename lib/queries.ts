import { supabase } from "@/lib/supabase/server";
import { routing } from "@/i18n/routing";
import { UNIT_ID_RE } from "@/lib/unit-id";

/**
 * localeCompare throws RangeError on an empty-string locale, which takes down the whole
 * page render. Validate against the configured locales and let Intl pick the default
 * otherwise. Intl.Collator also caches, unlike a localeCompare call per comparison.
 */
export function collator(locale: string) {
  const valid = (routing.locales as readonly string[]).includes(locale);
  return new Intl.Collator(valid ? locale : undefined);
}

export type UnitClass =
  | "Infantry"
  | "Archer"
  | "Cavalry"
  | "CavalryArcher"
  | "Siege"
  | "Naval"
  | "Monk"
  | "Other";

/**
 * Fixed display order for classes. Counter lists group by it so the same page reads in
 * the same order in every locale: sorting by translated name alone put Huskarl in one
 * place in English and Huscarle in another in Spanish.
 */
export const CLASS_ORDER: readonly UnitClass[] = [
  "Infantry",
  "Archer",
  "Cavalry",
  "CavalryArcher",
  "Siege",
  "Naval",
  "Monk",
  "Other",
];

export type Stats = {
  hp: number | null;
  attack: number | null;
  meleeArmor: number | null;
  pierceArmor: number | null;
  range: number | null;
  speed: number | null;
  cost: Partial<Record<"Food" | "Wood" | "Gold" | "Stone", number>>;
};

/** One entry per unit line. `name` is the base unit's name in the requested locale. */
export type LineSummary = {
  id: string;
  name: string;
  civ: string | null;
  unitClass: UnitClass;
  isUnique: boolean;
  /** Every tier in the line, lowest first: Knight, Cavalier, Paladin, Savar. */
  units: { id: string; name: string }[];
  counterCount: number;
};

/** A line on a counter list, plus the note for that specific matchup (most have none). */
export type CounterEntry = LineSummary & { reason: string | null };

export type LineDetail = LineSummary & {
  stats: Stats | null;
  /** Lines that beat this one. */
  counteredBy: CounterEntry[];
  /** Lines this one beats. The inverse edge, which the old static data never exposed. */
  strongAgainst: CounterEntry[];
};

type Row = {
  id: string;
  civ_id: string | null;
  is_unique: boolean;
  unit_class: UnitClass;
  sort_order: number;
  unit: { id: string; tier: number; stats: Stats | null; unit_name: { name: string }[] }[];
  counter: { count: number }[];
};

const SELECT = `
  id, civ_id, is_unique, unit_class, sort_order,
  unit ( id, tier, stats, unit_name ( name ) ),
  counter!counter_target_fkey ( count )
`;

function toSummary(row: Row): LineSummary {
  const units = [...row.unit]
    .sort((a, b) => a.tier - b.tier)
    .map((u) => ({ id: u.id, name: u.unit_name[0]?.name ?? u.id }));

  return {
    id: row.id,
    // The line is named after its base tier: the "Knight" line, not the "Savar" line.
    name: units[0]?.name ?? row.id,
    civ: row.civ_id,
    unitClass: row.unit_class,
    isUnique: row.is_unique,
    units,
    counterCount: row.counter[0]?.count ?? 0,
  };
}

/** Every line, ordered by name. Powers the browse grid and the search index. */
export async function getLines(locale: string): Promise<LineSummary[]> {
  const { data, error } = await supabase
    .from("unit_line")
    .select(SELECT)
    .eq("unit.unit_name.locale", locale);
  if (error) throw error;

  const cmp = collator(locale);
  return (data as unknown as Row[]).map(toSummary).sort((a, b) => cmp.compare(a.name, b.name));
}

/** Just the ids, for generateStaticParams and the sitemap. */
export async function getLineIds(): Promise<string[]> {
  const { data, error } = await supabase.from("unit_line").select("id");
  if (error) throw error;
  return data.map((r) => r.id);
}

export async function getLine(id: string, locale: string): Promise<LineDetail | null> {
  // Route params arrive lowercased; ids are PascalCase.
  const { data: match } = await supabase.from("unit_line").select("id").ilike("id", id).single();
  if (!match) return null;
  // match.id comes back from the database so it is already safe, but it is interpolated
  // into the .or() below and that filter parser treats commas and parens as syntax.
  if (!UNIT_ID_RE.test(match.id)) return null;

  const [{ data: rows, error }, { data: edges }] = await Promise.all([
    supabase.from("unit_line").select(SELECT).eq("unit.unit_name.locale", locale),
    supabase
      .from("counter")
      .select("line_id, counter_line_id, reason_en, reason_es")
      .or(`line_id.eq.${match.id},counter_line_id.eq.${match.id}`),
  ]);
  if (error) throw error;

  const byId = new Map((rows as unknown as Row[]).map((r) => [r.id, toSummary(r)]));
  const self = byId.get(match.id);
  if (!self) return null;

  const cmp = collator(locale);
  // The note is written for the edge, not the unit, so it comes off the row and not the summary.
  const reasonOf = (e: { reason_en: string | null; reason_es: string | null }) =>
    (locale === "es" ? e.reason_es : e.reason_en) ?? null;
  const pick = (
    rows: { id: string; reason_en: string | null; reason_es: string | null }[]
  ): CounterEntry[] =>
    rows
      .map((r) => {
        const line = byId.get(r.id);
        return line && { ...line, reason: reasonOf(r) };
      })
      .filter((l): l is CounterEntry => Boolean(l))
      .sort((a, b) => cmp.compare(a.name, b.name));

  const base = (rows as unknown as Row[]).find((r) => r.id === match.id);
  const baseUnit = [...(base?.unit ?? [])].sort((a, b) => a.tier - b.tier)[0];

  return {
    ...self,
    stats: baseUnit?.stats ?? null,
    counteredBy: pick(
      (edges ?? [])
        .filter((e) => e.line_id === match.id)
        .map((e) => ({ ...e, id: e.counter_line_id }))
    ),
    strongAgainst: pick(
      (edges ?? []).filter((e) => e.counter_line_id === match.id).map((e) => ({ ...e, id: e.line_id }))
    ),
  };
}

export type StatMaxima = Record<
  "hp" | "attack" | "meleeArmor" | "pierceArmor" | "range" | "speed",
  number
>;

/** Game-wide maximum per stat, so a meter has a limit to be read against. */
export async function getStatMaxima(): Promise<StatMaxima> {
  const { data, error } = await supabase.from("stat_maxima").select("*").single();
  if (error) throw error;
  // The view returns numerics, which PostgREST serialises as strings.
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, Number(v)])
  ) as StatMaxima;
}

export async function getCivilizations(): Promise<string[]> {
  const { data, error } = await supabase.from("civilization").select("id").order("id");
  if (error) throw error;
  return data.map((r) => r.id);
}
