import { CombineMode } from "./types";

export function combineWords(
  prefixes: string[],
  suffixes: string[],
  mode: CombineMode
): string[] {
  const cleanPrefixes = prefixes.map((w) => w.toLowerCase().trim()).filter(Boolean);
  const cleanSuffixes = suffixes.map((w) => w.toLowerCase().trim()).filter(Boolean);

  const results: string[] = [];

  if (mode === "prefix-suffix" || mode === "prefix-suffix-reverse") {
    for (const prefix of cleanPrefixes) {
      for (const suffix of cleanSuffixes) {
        results.push(`${prefix}${suffix}`);
      }
    }
  }

  if (mode === "prefix-suffix-reverse") {
    for (const suffix of cleanSuffixes) {
      for (const prefix of cleanPrefixes) {
        results.push(`${suffix}${prefix}`);
      }
    }
  }

  if (mode === "interleave") {
    for (const prefix of cleanPrefixes) {
      for (const suffix of cleanSuffixes) {
        results.push(`${prefix}${suffix}`);
        results.push(`${suffix}${prefix}`);
      }
    }
  }

  return [...new Set(results)];
}

export function generateDomains(
  words: string[],
  tlds: string[]
): string[] {
  return words.flatMap((word) =>
    tlds.map((tld) => `${word}.${tld}`)
  );
}