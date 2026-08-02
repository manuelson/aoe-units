import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/server";
import { isAuthed } from "@/lib/admin-auth";
import { getLineForAdmin } from "@/lib/admin-queries";
import { CLASS_ORDER } from "@/lib/queries";
import { fromFlat, type FlatStats } from "@/lib/stats-fields";
import { UNIT_ID_RE } from "@/lib/unit-id";
import { routing } from "@/i18n/routing";

/**
 * Direct catalog editing. Separate from ../route.ts, which is the moderation queue and
 * already long enough.
 *
 * Note the stats semantics differ from the queue on purpose: there, approving a
 * suggestion merges a partial diff into unit.stats. Here the editor sends the whole
 * object, so clearing a field in the form has to clear it in the database.
 */

const bad = (error: string, field?: string) =>
  NextResponse.json({ error, field }, { status: 400 });

type TierInput = {
  id?: unknown;
  tier?: unknown;
  dataId?: unknown;
  nameEn?: unknown;
  nameEs?: unknown;
  stats?: unknown;
};

type EdgeInput = { lineId?: unknown; reasonEn?: unknown; reasonEs?: unknown };

const text = (v: unknown, max: number) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

/** Guards against a cross-site form post; the cookie is sameSite=lax, this is belt. */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export async function PUT(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "bad origin" }, { status: 403 });
  }

  const raw = await req.text();
  if (raw.length > 100_000) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  let body: {
    id?: unknown;
    civ?: unknown;
    unitClass?: unknown;
    isUnique?: unknown;
    tiers?: unknown;
    counteredBy?: unknown;
    strongAgainst?: unknown;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return bad("invalid json");
  }

  const id = body.id;
  if (typeof id !== "string" || !UNIT_ID_RE.test(id)) return bad("invalid id", "id");

  const unitClass = body.unitClass;
  if (typeof unitClass !== "string" || !CLASS_ORDER.includes(unitClass as never)) {
    return bad("unknown class", "unitClass");
  }

  if (typeof body.isUnique !== "boolean") return bad("isUnique must be a boolean", "isUnique");

  const db = serviceClient();

  // An unknown civ is an error here, not noise to be silenced: this caller is a moderator.
  const civ = body.civ === null || body.civ === "" ? null : body.civ;
  if (civ !== null) {
    if (typeof civ !== "string") return bad("invalid civ", "civ");
    const { data } = await db.from("civilization").select("id").eq("id", civ).maybeSingle();
    if (!data) return bad("unknown civilization", "civ");
  }

  // ------------------------------------------------------------------------- tiers
  if (!Array.isArray(body.tiers) || body.tiers.length < 1 || body.tiers.length > 8) {
    return bad("a line needs between 1 and 8 tiers", "tiers");
  }

  const seenTierIds = new Set<string>();
  const tiers = [];
  for (const [i, t] of (body.tiers as TierInput[]).entries()) {
    const tid = t.id;
    if (typeof tid !== "string" || !UNIT_ID_RE.test(tid)) return bad("invalid tier id", `tiers.${i}.id`);
    if (seenTierIds.has(tid)) return bad("duplicate tier id", `tiers.${i}.id`);
    seenTierIds.add(tid);

    // Renumbered from the array order, which is also what unit_line_tier_uniq expects and
    // what makes toSummary() name the line after its base tier.
    const nameEn = text(t.nameEn, 80);
    const nameEs = text(t.nameEs, 80);
    if (!nameEn) return bad("English name is required", `tiers.${i}.nameEn`);
    // Without a Spanish name getLines("es") falls back to the id and the site shows
    // "Knight" in Spanish, which is worse than an error here.
    if (!nameEs) return bad("Spanish name is required", `tiers.${i}.nameEs`);

    const dataId =
      t.dataId === null || t.dataId === "" || t.dataId === undefined
        ? null
        : Number(t.dataId);
    if (dataId !== null && !Number.isInteger(dataId)) return bad("invalid data id", `tiers.${i}.dataId`);

    // fromFlat drops anything out of range *silently*, which is right for the public form
    // and wrong here: a moderator typing hp 5000 would watch it vanish on save.
    const flat = (t.stats ?? {}) as FlatStats;
    const sent = Object.entries(flat).filter(([, v]) => v !== null && v !== undefined && v !== ("" as unknown));
    const stats = fromFlat(Object.fromEntries(sent));
    const kept = new Set(
      stats
        ? [
            ...Object.keys(stats).filter((k) => k !== "cost"),
            ...Object.keys(stats.cost ?? {}).map((k) => `cost.${k}`),
          ]
        : []
    );
    const dropped = sent.map(([k]) => k).find((k) => !kept.has(k));
    if (dropped) return bad("value out of range", `tiers.${i}.${dropped}`);

    tiers.push({ id: tid, tier: i, dataId, nameEn, nameEs, stats: stats ?? null });
  }

  // ------------------------------------------------------------------------ counters
  const edges = (v: unknown, field: string) => {
    if (!Array.isArray(v)) return { error: bad("expected a list", field) };
    if (v.length > 60) return { error: bad("too many counters", field) };
    const out = new Map<string, { lineId: string; reasonEn: string | null; reasonEs: string | null }>();
    for (const e of v as EdgeInput[]) {
      const lineId = e.lineId;
      if (typeof lineId !== "string" || !UNIT_ID_RE.test(lineId)) {
        return { error: bad("invalid counter id", field) };
      }
      if (lineId === id) return { error: bad("a unit cannot counter itself", field) };
      out.set(lineId, {
        lineId,
        reasonEn: text(e.reasonEn, 200),
        reasonEs: text(e.reasonEs, 200),
      });
    }
    return { list: [...out.values()] };
  };

  const beaten = edges(body.counteredBy, "counteredBy");
  if (beaten.error) return beaten.error;
  const beats = edges(body.strongAgainst, "strongAgainst");
  if (beats.error) return beats.error;

  const referenced = [...new Set([...beaten.list!.map((e) => e.lineId), ...beats.list!.map((e) => e.lineId)])];
  if (referenced.length > 0) {
    const { data: known } = await db.from("unit_line").select("id").in("id", referenced);
    const knownIds = new Set((known ?? []).map((r) => r.id));
    const missing = referenced.find((r) => !knownIds.has(r));
    if (missing) return bad(`unknown line ${missing}`, "counters");
  }

  // ---------------------------------------------------------------------------- save
  const { data: result, error } = await db.rpc("admin_save_line", {
    payload: {
      id,
      civ,
      unitClass,
      isUnique: body.isUnique,
      tiers,
      counteredBy: beaten.list,
      strongAgainst: beats.list,
    },
  });

  if (error) {
    console.error("admin_save_line failed:", error);
    const status = error.code === "P0002" ? 404 : 409;
    return NextResponse.json({ error: error.message }, { status });
  }

  revalidate([id, ...((result?.touched ?? []) as string[])]);
  return NextResponse.json({ ok: true, touched: result?.touched ?? [] });
}

export async function DELETE(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "bad origin" }, { status: 403 });
  }

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (typeof id !== "string" || !UNIT_ID_RE.test(id)) return bad("invalid id", "id");

  // Read the neighbours before they stop existing: their pages need revalidating too.
  const line = await getLineForAdmin(id);
  if (!line) return NextResponse.json({ error: "unknown unit" }, { status: 404 });

  const db = serviceClient();
  // One statement, already atomic. Cascades to unit -> unit_name and stat_suggestion,
  // both directions of counter, counter_vote and counter_suggestion.
  const { error } = await db.from("unit_line").delete().eq("id", id);
  if (error) {
    console.error("line delete failed:", error);
    return NextResponse.json({ error: "could not delete" }, { status: 500 });
  }

  revalidate([
    id,
    ...line.counteredBy.map((e) => e.lineId),
    ...line.strongAgainst.map((e) => e.lineId),
  ]);
  return NextResponse.json({ ok: true });
}

/**
 * Targeted, not revalidatePath("/", "layout"): that drops the whole ISR cache for both
 * locales, which is fine for a queue touched twice a day and not for an editor you save
 * five times in a row.
 */
function revalidate(lines: string[]) {
  for (const locale of routing.locales) {
    for (const line of new Set(lines)) {
      revalidatePath(`/${locale}/unit/${line.toLowerCase()}`);
    }
    revalidatePath(`/${locale}/units`);
    revalidatePath(`/${locale}`);
  }
}
