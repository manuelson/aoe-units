/**
 * ponytail: self-check instead of a test framework. Run with `npm run check:search`.
 * Kept out of rank.ts because that module is imported by client components, and a
 * `require.main === module` guard throws "module is not defined" in the browser bundle.
 */
import {
  score,
  rank,
  EXACT,
  PREFIX,
  WORD_PREFIX,
  SUBSEQUENCE,
  NO_MATCH,
} from "./rank";

const assert = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(`FAIL: ${msg}`);
};

const knight = { name: "Caballero", units: [{ name: "Caballero" }, { name: "Paladín" }] };
const archer = { name: "Arquero", units: [{ name: "Arquero" }, { name: "Ballestero" }] };
const hand = { name: "Hand Cannoneer", units: [{ name: "Hand Cannoneer" }] };

assert(score("caballero", knight) === EXACT, "exact name match");
assert(score("PALADIN", knight) === EXACT, "matches a later tier, accent-insensitive");
assert(score("cab", knight) === PREFIX, "prefix beats substring");
assert(score("cannoneer", hand) === WORD_PREFIX, "second word prefix");
assert(score("hcan", hand) === SUBSEQUENCE, "subsequence fallback");
assert(score("zzz", knight) === NO_MATCH, "no match is filtered");
assert(rank("", [knight, archer]).length === 2, "empty query keeps everything");
assert(rank("bal", [knight, archer])[0] === archer, "ranks by best tier match");
assert(rank("a", [knight, archer]).length === 2, "single char still matches");
assert(rank("zzz", [knight, archer]).length === 0, "unmatched query yields nothing");

console.log("rank.ts: all checks passed");
