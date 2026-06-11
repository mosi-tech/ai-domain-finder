export interface DomainResult {
  domain: string;
  available: boolean;
  price?: number;
  isPremium?: boolean;
}

export interface DomainCheckResponse {
  results: DomainResult[];
  checked: number;
}

export interface PresetList {
  id: string;
  name: string;
  words: string[];
}

export type CombineMode = "prefix-suffix" | "prefix-suffix-reverse" | "interleave";