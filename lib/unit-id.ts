import type { SupabaseClient } from "@supabase/supabase-js";

/** Ids are PascalCase ASCII. Anything else breaks /units/{id}.png and the route params. */
export const UNIT_ID_RE = /^[A-Za-z0-9]{1,60}$/;

/** "Hand Cannoneer" -> "HandCannoneer", which is also the image filename convention. */
export function toPascalId(name: string) {
  const id = name
    .normalize("NFD")
    // Escaped, not the literal combining marks: those do not survive a reformat.
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
  return id || "Unit";
}

export async function uniqueLineId(db: SupabaseClient, base: string) {
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}${i + 1}`;
    const { data } = await db.from("unit_line").select("id").eq("id", candidate).single();
    if (!data) return candidate;
  }
  throw new Error(`could not find a free id for ${base}`);
}
