// Shared validation and sanitization utilities

// Allowed domain name pattern: lowercase letters, digits, hyphens (not at start/end)
const DOMAIN_LABEL_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
// Max length for a domain label (before the dot)
const MAX_LABEL_LENGTH = 63;
// Allowed TLD pattern
const TLD_REGEX = /^[a-z]{2,}$/;
// Allowed word pattern for prefix/suffix: lowercase letters and digits only
const MAX_WORD_LENGTH = 20;
const MAX_WORDS_PER_LIST = 50;
const MAX_IDEA_LENGTH = 500;

/**
 * Sanitize a single word for domain name generation.
 * Strips non-alphanumeric chars, lowercases, validates length.
 */
export function sanitizeWord(word: string): string | null {
  const cleaned = word.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (cleaned.length < 1 || cleaned.length > MAX_WORD_LENGTH) return null;
  return cleaned;
}

/**
 * Validate and sanitize a list of words for prefix/suffix input.
 * Returns cleaned list, or null if invalid.
 */
export function sanitizeWordList(raw: string): string[] | null {
  const words = raw
    .split(/[,\n]+/)
    .map((w) => w.trim().toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length >= 1 && w.length <= MAX_WORD_LENGTH);

  if (words.length === 0 || words.length > MAX_WORDS_PER_LIST) return null;
  return words;
}

/**
 * Validate a domain name label (the part before the dot).
 */
export function isValidDomainLabel(label: string): boolean {
  if (!label || label.length > MAX_LABEL_LENGTH) return false;
  return DOMAIN_LABEL_REGEX.test(label);
}

/**
 * Validate a TLD string.
 */
export function isValidTLD(tld: string): boolean {
  if (!tld) return false;
  return TLD_REGEX.test(tld) && tld.length >= 2 && tld.length <= 10;
}

/**
 * Validate and sanitize a domain string (e.g. "smartcloud.ai").
 * Returns the cleaned domain or null if invalid.
 */
export function sanitizeDomain(domain: string): string | null {
  const trimmed = domain.trim().toLowerCase();
  // Must contain at least one dot
  if (!trimmed.includes(".")) return null;

  const parts = trimmed.split(".");
  if (parts.length < 2) return null;

  const label = parts[0];
  const tld = parts.slice(1).join(".");

  if (!isValidDomainLabel(label)) return null;
  if (!isValidTLD(tld)) return null;

  // Total domain length check (max 253 chars per RFC)
  if (trimmed.length > 253) return null;

  return trimmed;
}

/**
 * Sanitize user idea text for LLM generation.
 * Strips HTML tags, normalizes whitespace, caps length.
 */
export function sanitizeIdea(idea: string): string | null {
  const cleaned = idea
    .trim()
    // Strip any HTML tags
    .replace(/<[^>]*>/g, "")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    // Remove any control characters
    .replace(/[\x00-\x1F\x7F]/g, "")
    // Remove any URL-like patterns (prevent prompt injection via URLs)
    .replace(/https?:\/\/\S+/gi, "")
    // Remove any script-like patterns
    .replace(/(?:eval|function|javascript|on\w+=)/gi, "")
    .trim();

  if (cleaned.length === 0 || cleaned.length > MAX_IDEA_LENGTH) return null;
  return cleaned;
}

/**
 * Validate the type parameter for generate endpoint.
 */
export function isValidGenerateType(type: unknown): type is "prefix" | "suffix" | null {
  return type === "prefix" || type === "suffix" || type === null;
}

/**
 * Sanitize and validate a list of domains for the check endpoint.
 * Returns cleaned domains or null if any are invalid.
 */
export function sanitizeDomainList(domains: unknown): string[] | null {
  if (!Array.isArray(domains)) return null;
  if (domains.length === 0 || domains.length > 50) return null;

  const cleaned: string[] = [];
  for (const d of domains) {
    if (typeof d !== "string") return null;
    const sanitized = sanitizeDomain(d);
    if (!sanitized) return null;
    cleaned.push(sanitized);
  }
  return cleaned;
}