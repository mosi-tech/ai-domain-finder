import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { sanitizeIdea, isValidGenerateType, sanitizeWord } from "@/lib/sanitize";

const LITELLM_MODEL = process.env.LITELLM_MODEL || "gpt-4o-mini";
const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL || "https://api.openai.com/v1";
const LITELLM_API_KEY = process.env.LITELLM_API_KEY || "sk-no-key";

function generateFallback(idea: string, type: "prefix" | "suffix" | null): string[] {
  const prefixPatterns = [
    idea.slice(0, 4), idea.slice(0, 3), idea.slice(0, 2),
    `${idea.slice(0, 3)}x`, `${idea.slice(0, 2)}neo`,
    `my${idea.slice(0, 4)}`, `${idea.slice(0, 3)}ly`,
    `go${idea.slice(0, 3)}`, `${idea.slice(0, 3)}up`,
    `get${idea.slice(0, 3)}`, `${idea.slice(0, 2)}zap`,
    `${idea.slice(0, 3)}flow`,
  ];

  const suffixPatterns = [
    idea.slice(0, 4), idea.slice(0, 3),
    `${idea.slice(0, 3)}hub`, `${idea.slice(0, 3)}lab`,
    `${idea.slice(0, 3)}app`, `${idea.slice(0, 3)}base`,
    `${idea.slice(0, 3)}flow`, `${idea.slice(0, 3)}stack`,
    `${idea.slice(0, 3)}forge`, `${idea.slice(0, 3)}mind`,
    `${idea.slice(0, 3)}logic`, `${idea.slice(0, 3)}works`,
  ];

  if (type === "suffix") {
    return [...new Set(suffixPatterns.filter((w) => w.length >= 2))].slice(0, 12);
  }
  if (type === "prefix") {
    return [...new Set(prefixPatterns.filter((w) => w.length >= 2))].slice(0, 12);
  }
  const all = [...prefixPatterns, ...suffixPatterns];
  return [...new Set(all.filter((w) => w.length >= 2))].slice(0, 12);
}

const COMMON_ENGLISH_WORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
  "her", "was", "one", "our", "out", "has", "have", "this", "that", "with",
  "from", "they", "been", "said", "each", "which", "she", "more", "will",
  "other", "about", "many", "then", "them", "these", "some", "would", "make",
  "like", "time", "very", "when", "what", "your", "there", "use", "word",
  "how", "each", "she", "more", "write", "number", "way", "could",
  "people", "than", "first", "water", "call", "who", "oil", "its",
  "now", "find", "long", "down", "day", "did", "get", "come", "made",
  "may", "part", "also", "new", "just", "should", "over", "take",
  "after", "only", "good", "think", "need", "know", "see", "back",
  "still", "much", "before", "well", "here", "must", "where", "why",
  "while", "being", "into", "too", "most", "those", "same", "keep",
  "because", "even", "through", "great", "start", "work", "world",
  "still", "between", "never", "under", "last", "right", "too",
  "going", "thing", "look", "only", "want", "say", "help",
  "generate", "short", "catchy", "brandable", "words", "related",
  "prefix", "suffix", "domain", "names", "each", "should", "syllable",
  "lowercase", "spaces", "dots", "output", "only", "comma", "separated",
  "nothing", "else", "example", "given", "list", "request", "analyze",
]);

function extractWords(text: string): string[] {
  const lines = text.split("\n");

  for (const line of lines) {
    const parts = line.split(",").map((w) => w.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
    const validParts = parts.filter((w) => w.length >= 2 && w.length <= 12 && !COMMON_ENGLISH_WORDS.has(w));
    if (validParts.length >= 5) {
      return [...new Set(validParts)];
    }
  }

  const allWords = text
    .split(/[,.\n;:!?()\[\]{}"']+/)
    .map((w) => w.trim().toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length >= 2 && w.length <= 8 && !COMMON_ENGLISH_WORDS.has(w));

  return [...new Set(allWords)];
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { idea, type } = body as { idea: string; type: "prefix" | "suffix" | null };

  // Validate and sanitize idea
  const cleanIdea = sanitizeIdea(idea);
  if (!cleanIdea) {
    return NextResponse.json({ error: "Invalid or empty idea text" }, { status: 400 });
  }

  // Validate type
  if (!isValidGenerateType(type)) {
    return NextResponse.json({ error: "Invalid type. Must be 'prefix', 'suffix', or null" }, { status: 400 });
  }

  const count = 12;

  try {
    const client = new OpenAI({
      apiKey: LITELLM_API_KEY,
      baseURL: LITELLM_BASE_URL,
    });

    let systemContent: string;
    if (type === "prefix") {
      systemContent = `You are a creative domain naming assistant. The user will describe an idea, and you must generate ${count} short, catchy PREFIX words related to that idea. A PREFIX is a word that goes BEFORE the main word in a domain name. For example in "smartcloud", "smart" is the prefix. Rules: each word must be 1-2 syllables, lowercase, no spaces, no dots, suitable for a domain name. Your ENTIRE response must be ONLY a comma-separated list of words. No explanation, no reasoning, no numbering. Example response format: spark, neo, flux, vault, pulse, zen, apex, nova, kri, vox, nimb, zeta`;
    } else if (type === "suffix") {
      systemContent = `You are a creative domain naming assistant. The user will describe an idea, and you must generate ${count} short, catchy SUFFIX words related to that idea. A SUFFIX is a word that goes AFTER the main word in a domain name. For example in "cloudhub", "hub" is the suffix. Rules: each word must be 1-2 syllables, lowercase, no spaces, no dots, suitable for a domain name. Your ENTIRE response must be ONLY a comma-separated list of words. No explanation, no reasoning, no numbering. Example response format: hub, lab, app, io, ly, ify, flow, stack, forge, mind, logic, works`;
    } else {
      systemContent = `You are a creative domain naming assistant. The user will describe an idea, and you must generate ${count} short, catchy, brandable words related to that idea. These words will be used in domain names. Rules: each word must be 1-2 syllables, lowercase, no spaces, no dots, suitable for a domain name. Your ENTIRE response must be ONLY a comma-separated list of words. No explanation, no reasoning, no numbering. Example response format: spark, neo, flux, vault, pulse, zen, apex, nova, kri, vox, nimb, zeta`;
    }

    const response = await client.chat.completions.create({
      model: LITELLM_MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: cleanIdea },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    const choice = response.choices?.[0];
    let content = choice?.message?.content?.trim() || "";

    if (!content) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = choice?.message as any;
      if (msg?.reasoning) {
        content = String(msg.reasoning).trim();
      }
    }

    if (!content) {
      throw new Error("No words generated");
    }

    const rawWords = extractWords(content);
    // Sanitize each extracted word
    const words = rawWords.map(sanitizeWord).filter((w): w is string => w !== null);

    if (words.length >= 3) {
      return NextResponse.json({ words: words.slice(0, count) });
    }

    throw new Error("Not enough words parsed from LLM response");
  } catch (error) {
    console.error("LLM generation failed, using fallback:", error);
    const words = generateFallback(cleanIdea, type ?? null);
    return NextResponse.json({ words, fallback: true });
  }
}