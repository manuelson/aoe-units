import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";
import { ipHash } from "@/lib/ip-hash";
import { fromFlat } from "@/lib/stats-fields";

const UNIT_CLASSES = [
  "Infantry",
  "Archer",
  "Cavalry",
  "CavalryArcher",
  "Siege",
  "Naval",
  "Monk",
  "Other",
];

type Body = {
  kind?: string;
  lineId?: string;
  unitId?: string;
  accurate?: boolean;
  counters?: unknown;
  removeCounters?: unknown;
  stats?: unknown;
  name?: unknown;
  civ?: unknown;
  unitClass?: unknown;
  isUnique?: unknown;
  comment?: unknown;
  message?: unknown;
  page?: unknown;
  locale?: unknown;
};

const str = (v: unknown, max: number) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

/**
 * The only path that writes community feedback. RLS denies anon writes on every
 * feedback table, so everything here runs with the service role and this handler
 * decides ip_hash, voted_on and status. A client cannot self-approve or forge its
 * rate-limit identity.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { kind, lineId, unitId, accurate, counters, comment, locale } = body ?? {};

  let db;
  let hash;
  try {
    db = serviceClient();
    hash = ipHash(req.headers);
  } catch (e) {
    console.error("feedback misconfigured:", e);
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  const note = str(comment, 500);

  // ------------------------------------------------------- free-form site report
  // No lineId: the point of this one is to catch what the structured forms miss.
  if (kind === "report") {
    const message = str(body.message, 2000);
    if (!message || message.length < 3) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const { error } = await db.from("site_report").insert({
      message,
      page: str(body.page, 200),
      locale: typeof locale === "string" ? locale.slice(0, 8) : null,
      status: "pending",
      ip_hash: hash,
    });

    if (error) {
      console.error("report insert failed:", error);
      return NextResponse.json({ error: "could not save" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ------------------------------------------------------------ a whole new unit
  // Handled before the lineId check: a unit that does not exist yet has no line.
  if (kind === "new-unit") {
    const name = str(body.name, 60);
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }

    const unitClass =
      typeof body.unitClass === "string" && UNIT_CLASSES.includes(body.unitClass)
        ? body.unitClass
        : "Other";

    // A civ that is not in the table would violate the FK, so drop it instead.
    let civ = str(body.civ, 40);
    if (civ) {
      const { data } = await db.from("civilization").select("id").eq("id", civ).single();
      if (!data) civ = null;
    }

    const picked = Array.isArray(counters)
      ? counters.filter((c): c is string => typeof c === "string" && !!c).slice(0, 30)
      : [];
    const { data: known } = await db.from("unit_line").select("id").in("id", picked);
    const knownCounters = (known ?? []).map((r) => r.id);

    const { error } = await db.from("unit_suggestion").insert({
      name,
      civ_id: civ,
      unit_class: unitClass,
      is_unique: body.isUnique === true,
      stats: fromFlat(body.stats),
      counters: knownCounters,
      comment: note,
      status: "pending",
      ip_hash: hash,
    });

    if (error) {
      console.error("unit suggestion insert failed:", error);
      return NextResponse.json({ error: "could not save" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ------------------------------------------------------------ stat correction
  if (kind === "stats") {
    if (typeof unitId !== "string" || !unitId) {
      return NextResponse.json({ error: "unitId required" }, { status: 400 });
    }
    const { data: unit } = await db.from("unit").select("id").eq("id", unitId).single();
    if (!unit) return NextResponse.json({ error: "unknown unit" }, { status: 404 });

    const stats = fromFlat(body.stats);
    if (!stats) return NextResponse.json({ error: "no valid stats" }, { status: 400 });

    const { error } = await db.from("stat_suggestion").insert({
      unit_id: unitId,
      stats,
      comment: note,
      status: "pending",
      ip_hash: hash,
    });

    if (error) {
      console.error("stat suggestion insert failed:", error);
      return NextResponse.json({ error: "could not save" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ------------------------------------------------- everything else needs a line
  if (typeof lineId !== "string" || !lineId) {
    return NextResponse.json({ error: "lineId required" }, { status: 400 });
  }

  // The line must exist. Without this a caller could probe for a 500 by sending junk.
  const { data: line } = await db.from("unit_line").select("id").eq("id", lineId).single();
  if (!line) return NextResponse.json({ error: "unknown unit" }, { status: 404 });

  if (kind === "vote") {
    if (typeof accurate !== "boolean") {
      return NextResponse.json({ error: "accurate required" }, { status: 400 });
    }

    const { error } = await db.from("counter_vote").insert({
      line_id: lineId,
      is_accurate: accurate,
      locale: typeof locale === "string" ? locale.slice(0, 8) : null,
      ip_hash: hash,
    });

    // 23505 = unique violation, i.e. already voted today. Idempotent, not an error.
    if (error && error.code !== "23505") {
      console.error("vote insert failed:", error);
      return NextResponse.json({ error: "could not save" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, duplicate: error?.code === "23505" });
  }

  if (kind === "suggestion") {
    const list = (v: unknown, max: number) =>
      Array.isArray(v)
        ? v.filter((c): c is string => typeof c === "string" && !!c).slice(0, max)
        : [];

    const toAdd = list(counters, 20);
    const toRemove = list(body.removeCounters, 20);
    if (toAdd.length === 0 && toRemove.length === 0) {
      return NextResponse.json({ error: "no counters given" }, { status: 400 });
    }

    // Only accept ids that really exist; anything else goes in as free text so a
    // typo still reaches the reviewer instead of failing the whole submission.
    const { data: known } = await db
      .from("unit_line")
      .select("id")
      .in("id", [...toAdd, ...toRemove]);
    const knownIds = new Set((known ?? []).map((r) => r.id));

    const rows = [
      ...toAdd.map((c) => ({
        line_id: lineId,
        suggested_line_id: knownIds.has(c) ? c : null,
        free_text: knownIds.has(c) ? null : c.slice(0, 80),
        action: "add",
        comment: note,
        status: "pending",
        ip_hash: hash,
      })),
      // A removal must name a real line: there is nothing to delete otherwise.
      ...toRemove
        .filter((c) => knownIds.has(c))
        .map((c) => ({
          line_id: lineId,
          suggested_line_id: c,
          free_text: null,
          action: "remove",
          comment: note,
          status: "pending",
          ip_hash: hash,
        })),
    ];

    if (rows.length === 0) {
      return NextResponse.json({ error: "no valid counters" }, { status: 400 });
    }

    const { error } = await db.from("counter_suggestion").insert(rows);
    if (error) {
      console.error("suggestion insert failed:", error);
      return NextResponse.json({ error: "could not save" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, count: rows.length });
  }

  return NextResponse.json({ error: "unknown kind" }, { status: 400 });
}
