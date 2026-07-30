import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "aoe_admin";

/**
 * ponytail: one shared password in an env var, no user table. The cookie holds an HMAC
 * of the password rather than the password itself, so reading it does not reveal the
 * secret. Move to Supabase Auth if there is ever more than one moderator.
 */
function token(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD is not set");
  return createHmac("sha256", pw).update("admin-session-v1").digest("hex");
}

export function checkPassword(candidate: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(pw);
  // Compare in constant time; length is compared separately since timingSafeEqual throws
  // on mismatched lengths, which would itself leak the length.
  return a.length === b.length && timingSafeEqual(a, b);
}

export function sessionToken(): string {
  return token();
}

export async function isAuthed(): Promise<boolean> {
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  try {
    const a = Buffer.from(value);
    const b = Buffer.from(token());
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
