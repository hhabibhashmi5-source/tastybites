// Pure, shared "is this a real-looking name?" check.
// Used by BOTH the cart form (client) and the order-confirm route (server) so
// the two never disagree. No imports — safe in client and server code.
//
// IMPORTANT — this is a HEURISTIC, not a guarantee. Telling a made-up but
// vowel-shaped string like "osooiahwo" apart from a genuine unusual name is
// not solvable with a simple rule, so we err toward catching obvious
// keyboard-mashing while accepting that a few rare real names (e.g. "Louie")
// may get flagged. Loosen the rules below if that ever bites a real customer.

const VOWELS = "aeiouy";

// Check one word (a single token of the name) for "looks pronounceable".
function wordLooksReal(word) {
  const w = word.toLowerCase();

  // Must contain at least one vowel — blocks consonant mash like "bcdfg".
  if (![...w].some((ch) => VOWELS.includes(ch))) return false;

  // 3+ of the SAME letter in a row — "jjjj", "aaa".
  if (/(.)\1\1/.test(w)) return false;

  // 4+ consonants in a row — "ynfgr".
  if (/[bcdfghjklmnpqrstvwxz]{4,}/.test(w)) return false;

  // 4+ vowels in a row — catches vowel-heavy mash like "osooiahwo" (…ooia…).
  // (This is the rule that also flags "Louie"/"queue"-shaped names — the
  //  deliberate trade-off noted above.)
  if (/[aeiou]{4,}/.test(w)) return false;

  return true;
}

// Returns true if `raw` looks like a real human name.
export function isRealName(raw) {
  const name = String(raw ?? "").trim();

  // Length + allowed characters: must start with a letter; letters, spaces,
  // apostrophes, hyphens and periods only (no digits/symbols).
  if (name.length < 2 || name.length > 60) return false;
  if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(name)) return false;

  // At least 2 letters overall.
  if ((name.match(/\p{L}/gu) || []).length < 2) return false;

  // Every word has to look pronounceable.
  const words = name.split(/[\s.'-]+/).filter(Boolean);
  return words.every(wordLooksReal);
}

// The error message to show under the Name field when it fails.
export const NAME_ERROR =
  "Please enter a real name — e.g. “Jane Doe”.";
