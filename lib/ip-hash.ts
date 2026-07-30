import { createHash } from "node:crypto";

/**
 * Salted SHA-256 of the caller's IP. The raw address never reaches the database, and
 * without the salt the hash cannot be reversed by enumerating the IPv4 space.
 */
export function ipHash(headers: Headers): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) throw new Error("IP_HASH_SALT is not set");

  // x-forwarded-for is a client-supplied chain; the leftmost entry is the original
  // client, and on Vercel the platform overwrites the header so it cannot be spoofed.
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown";

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
