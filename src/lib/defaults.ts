import { PresetList } from "./types";

export const prefixPresets: PresetList[] = [
  {
    id: "ai-tech",
    name: "AI & Tech",
    words: [
      "ai", "neural", "deep", "smart", "cogni", "synth",
      "quantum", "cyber", "neo", "nexus", "flux", "vibe",
      "hyper", "nova", "meta", "apex", "pixel", "cloud",
    ],
  },
  {
    id: "action",
    name: "Action Words",
    words: [
      "get", "go", "try", "use", "make", "build",
      "launch", "start", "run", "fly", "dash", "swift",
      "fast", "quick", "snap", "bolt", "rush", "kick",
    ],
  },
  {
    id: "creative",
    name: "Creative",
    words: [
      "spark", "muse", "dream", "glow", "bloom", "aura",
      "lucid", "prism", "haze", "dusk", "dawn", "echo",
      "sage", "ember", "rift", "opal", "mist", "fern",
    ],
  },
  {
    id: "business",
    name: "Business",
    words: [
      "pro", "hub", "lab", "base", "corp", "inc",
      "group", "works", "forge", "stack", "link", "edge",
      "core", "grid", "port", "gate", "sync", "vault",
    ],
  },
];

export const suffixPresets: PresetList[] = [
  {
    id: "ai-suffix",
    name: "AI Suffixes",
    words: [
      "ai", "ml", "bot", "mind", "brain", "logic",
      "net", "ops", "flow", "tech", "data", "code",
      "lab", "hub", "base", "stack", "cloud", "core",
    ],
  },
  {
    id: "product",
    name: "Product",
    words: [
      "app", "io", "ly", "ify", "hub", "lab",
      "box", "kit", "zen", "pro", "max", "plus",
      "up", "go", "now", "one", "day", "way",
    ],
  },
  {
    id: "nature",
    name: "Nature",
    words: [
      "leaf", "root", "wave", "seed", "stone", "peak",
      "wind", "fire", "rain", "moon", "star", "sun",
      "tree", "lake", "hill", "cave", "pond", "grove",
    ],
  },
  {
    id: "tech-suffix",
    name: "Tech Suffixes",
    words: [
      "dev", "ops", "sec", "api", "sdk", "cli",
      "sql", "ml", "llm", "gpt", "nlp", "rpa",
      "saas", "paas", "devops", "sys", "eng", "arch",
    ],
  },
];

export const defaultTLDs = [
  { label: ".com", value: "com", popular: true },
  { label: ".ai", value: "ai", popular: true },
  { label: ".io", value: "io", popular: true },
  { label: ".co", value: "co", popular: true },
  { label: ".dev", value: "dev", popular: false },
  { label: ".app", value: "app", popular: false },
  { label: ".net", value: "net", popular: false },
  { label: ".org", value: "org", popular: false },
  { label: ".xyz", value: "xyz", popular: false },
  { label: ".tech", value: "tech", popular: false },
];