import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { serviceClient } from "@/lib/supabase/server";
import { ADMIN_COOKIE, checkPassword, isAuthed, sessionToken } from "@/lib/admin-auth";
import { toPascalId, uniqueLineId } from "@/lib/unit-id";

/** Sign in. Sets an httpOnly cookie holding an HMAC, never the password. */
export async function PUT(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (typeof password !== "string" || !checkPassword(password)) {
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}

/** Sign out. A 12h cookie on a shared machine needs a way off. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

/** Approve or reject a pending suggestion of any kind. */
export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, action, type } = (await req.json().catch(() => ({}))) as {
    id?: number;
    action?: string;
    type?: string;
  };

  if (
    typeof id !== "number" ||
    (action !== "approve" && action !== "reject") ||
    !["counter", "stats", "unit", "report"].includes(type ?? "")
  ) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const db = serviceClient();
  const table = {
    counter: "counter_suggestion",
    stats: "stat_suggestion",
    unit: "unit_suggestion",
    // A report has nothing to apply; approving just files it as handled.
    report: "site_report",
  }[type as "counter" | "stats" | "unit" | "report"];

  const { data: row } = await db.from(table).select("*").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (row.status !== "pending") {
    return NextResponse.json({ error: "already reviewed" }, { status: 409 });
  }

  const patch: Record<string, unknown> = {
    status: action === "approve" ? "approved" : "rejected",
    reviewed_at: new Date().toISOString(),
  };

  if (action === "approve") {
    if (type === "counter") {
      // Free-text suggestions have no line to link, so they can only be rejected or
      // acted on by hand. Approving one would silently drop the user's input.
      if (!row.suggested_line_id) {
        return NextResponse.json(
          { error: "free-text suggestions cannot be auto-approved" },
          { status: 422 }
        );
      }

      if (row.action === "remove") {
        // Deleting an edge that is already gone is a no-op, not a failure.
        const { error } = await db
          .from("counter")
          .delete()
          .eq("line_id", row.line_id)
          .eq("counter_line_id", row.suggested_line_id);
        if (error) {
          console.error("approve counter removal failed:", error);
          return NextResponse.json({ error: "could not apply" }, { status: 500 });
        }
      } else {
        const { error } = await db.from("counter").insert({
          line_id: row.line_id,
          counter_line_id: row.suggested_line_id,
          source: "community",
        });
        // 23505 means the edge already exists, which is a successful outcome here.
        if (error && error.code !== "23505") {
          console.error("approve counter failed:", error);
          return NextResponse.json({ error: "could not apply" }, { status: 500 });
        }
      }
    }

    if (type === "stats") {
      const { data: unit } = await db
        .from("unit")
        .select("stats")
        .eq("id", row.unit_id)
        .single();

      // Merge rather than replace: the suggestion only carries the changed fields.
      const merged = {
        ...(unit?.stats ?? {}),
        ...row.stats,
        cost: { ...(unit?.stats?.cost ?? {}), ...(row.stats?.cost ?? {}) },
      };

      const { error } = await db.from("unit").update({ stats: merged }).eq("id", row.unit_id);
      if (error) {
        console.error("approve stats failed:", error);
        return NextResponse.json({ error: "could not apply" }, { status: 500 });
      }
    }

    if (type === "unit") {
      const lineId = await uniqueLineId(db, toPascalId(row.name));

      const { data: maxOrder } = await db
        .from("unit_line")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .single();

      const steps: { label: string; run: () => PromiseLike<{ error: unknown }> }[] = [
        {
          label: "unit_line",
          run: () =>
            db.from("unit_line").insert({
              id: lineId,
              civ_id: row.civ_id,
              is_unique: row.is_unique,
              unit_class: row.unit_class,
              sort_order: (maxOrder?.sort_order ?? 0) + 1,
            }),
        },
        {
          label: "unit",
          run: () =>
            db.from("unit").insert({ id: lineId, line_id: lineId, tier: 0, stats: row.stats }),
        },
        {
          label: "unit_name",
          run: () =>
            // Same submitted name for both locales; a reviewer can translate it later.
            db
              .from("unit_name")
              .insert([
                { unit_id: lineId, locale: "en", name: row.name },
                { unit_id: lineId, locale: "es", name: row.name },
              ]),
        },
      ];

      for (const step of steps) {
        const { error } = await step.run();
        if (error) {
          console.error(`approve unit failed at ${step.label}:`, error);
          // Roll back by hand: there is no multi-statement transaction over PostgREST,
          // and a half-created unit would render a broken page.
          await db.from("unit_line").delete().eq("id", lineId);
          return NextResponse.json({ error: "could not create unit" }, { status: 500 });
        }
      }

      if (row.counters?.length) {
        await db.from("counter").insert(
          (row.counters as string[]).map((c) => ({
            line_id: lineId,
            counter_line_id: c,
            source: "community",
          }))
        );
      }

      patch.created_line_id = lineId;
    }
  }

  const { error } = await db.from(table).update(patch).eq("id", id);
  if (error) {
    console.error("status update failed:", error);
    return NextResponse.json({ error: "could not update" }, { status: 500 });
  }

  // Pages are ISR with a 1h window; without this an approval would not surface until
  // the window expired, and the reviewer would think nothing happened.
  if (action === "approve") revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, lineId: patch.created_line_id ?? null });
}
