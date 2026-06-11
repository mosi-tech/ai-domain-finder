"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  ChevronDown,
  Loader2,
  CheckCircle2,
  XCircle,
  Tag,

  Bot,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { combineWords, generateDomains } from "@/lib/domains";
import { prefixPresets, suffixPresets, defaultTLDs } from "@/lib/defaults";
import { sanitizeWordList, sanitizeDomain } from "@/lib/sanitize";
import { DomainResult, CombineMode } from "@/lib/types";

const combineModes: { id: CombineMode; label: string }[] = [
  { id: "prefix-suffix", label: "Prefix + Suffix" },
  { id: "prefix-suffix-reverse", label: "Both Ways" },
  { id: "interleave", label: "Interleave" },
];

type AIModalTarget = "prefix" | "suffix" | null;

export default function Home() {
  const [prefixText, setPrefixText] = useState("");
  const [suffixText, setSuffixText] = useState("");
  const [selectedTLDs, setSelectedTLDs] = useState<string[]>(["ai"]);
  const [combineMode, setCombineMode] = useState<CombineMode>("prefix-suffix");
  const [showAllTLDs, setShowAllTLDs] = useState(false);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"available" | "all" | "taken">("available");
  const [searched, setSearched] = useState(false);

  const [aiModalTarget, setAiModalTarget] = useState<AIModalTarget>(null);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiType, setAiType] = useState<"prefix" | "suffix" | "related">("related");

  const prefixWords = useMemo(() => prefixText.split(/[,\n]/).map((w) => w.trim()).filter(Boolean), [prefixText]);
  const suffixWords = useMemo(() => suffixText.split(/[,\n]/).map((w) => w.trim()).filter(Boolean), [suffixText]);
  const combinations = useMemo(() => combineWords(prefixWords, suffixWords, combineMode), [prefixWords, suffixWords, combineMode]);

  const toggleTLD = (tld: string) => {
    setSelectedTLDs((prev) =>
      prev.includes(tld) ? prev.filter((t) => t !== tld) : [...prev, tld]
    );
  };

  const applyPreset = useCallback(
    (words: string[], target: "prefix" | "suffix") => {
      const newWords = [...new Set(words)];
      if (target === "prefix") setPrefixText(newWords.join("\n"));
      else setSuffixText(newWords.join("\n"));
    },
    []
  );

  const handleAIGenerate = useCallback(async () => {
    const cleanInput = aiInput.trim().replace(/<[^>]*>/g, "").replace(/https?:\/\/\S+/gi, "").trim();
    if (!cleanInput || cleanInput.length > 500 || !aiModalTarget) return;
    setAiLoading(true);
    const typeParam = aiType === "related" ? null : aiType;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: cleanInput,
          type: typeParam,
        }),
      });
      const data = await res.json();
      if (data.words && data.words.length > 0) {
        const words = data.words.join("\n");
        if (aiModalTarget === "prefix") setPrefixText(words);
        else setSuffixText(words);
      }
    } catch {
    } finally {
      setAiLoading(false);
      setAiModalTarget(null);
      setAiInput("");
    }
  }, [aiInput, aiModalTarget, aiType]);

  const handleSearch = useCallback(async () => {
    const prefixes = sanitizeWordList(prefixText);
    const suffixes = sanitizeWordList(suffixText);

    if (!prefixes || !suffixes || prefixes.length === 0 || suffixes.length === 0 || selectedTLDs.length === 0) return;

    setLoading(true);
    setResults([]);
    setSearched(true);

    const combos = combineWords(prefixes, suffixes, combineMode);
    const rawDomains = generateDomains(combos, selectedTLDs);

    // Sanitize domains client-side before sending
    const domains = rawDomains.map(sanitizeDomain).filter((d): d is string => d !== null);

    if (domains.length === 0) {
      setLoading(false);
      return;
    }

    const batchSize = 50;
    const allResults: DomainResult[] = [];

    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      try {
        const res = await fetch("/api/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domains: batch }),
        });
        const data = await res.json();
        if (data.results) {
          allResults.push(...data.results);
          setResults([...allResults]);
        }
      } catch {
        allResults.push(...batch.map((d) => ({ domain: d, available: false })));
        setResults([...allResults]);
      }
    }

    setLoading(false);
  }, [prefixText, suffixText, selectedTLDs, combineMode]);

  const filteredResults = results.filter((r) => {
    if (filter === "available") return r.available;
    if (filter === "taken") return !r.available;
    return true;
  });

  const availableCount = results.filter((r) => r.available).length;
  const takenCount = results.filter((r) => !r.available).length;

  const openAIModal = (target: "prefix" | "suffix") => {
    setAiModalTarget(target);
    setAiInput("");
    setAiType("related");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* AI Modal */}
      <AnimatePresence>
        {aiModalTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => { setAiModalTarget(null); setAiInput(""); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">AI Word Generator</h3>
                    <p className="text-xs text-slate-500">Generate words for {aiModalTarget} list</p>
                  </div>
                </div>
                <button onClick={() => { setAiModalTarget(null); setAiInput(""); }} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Type selection */}
              <div className="mb-4 flex gap-2">
                {(["related", "prefix", "suffix"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAiType(t)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      aiType === t
                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                        : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:border-white/10 hover:text-slate-300"
                    }`}
                  >
                    {t === "related" ? "Related words" : t === "prefix" ? "Prefix words" : "Suffix words"}
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAIGenerate(); }}
                  placeholder={
                    aiType === "prefix" ? "e.g. A productivity app for remote teams..."
                    : aiType === "suffix" ? "e.g. A platform for creative collaboration..."
                    : "e.g. Productivity, remote teams, collaboration..."
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
                  autoFocus
                />
              </div>
              <button
                onClick={handleAIGenerate}
                disabled={aiLoading || !aiInput.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {aiLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Generating...</>) : (<><Sparkles className="w-4 h-4" />Generate {aiType === "related" ? "Related" : aiType === "prefix" ? "Prefix" : "Suffix"} Words</>)}
              </button>
              <p className="text-[11px] text-slate-600 mt-3 text-center">This will replace the current {aiModalTarget} words</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/5 backdrop-blur-xl bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">DomainForge</h1>
                <p className="text-xs text-slate-400">AI-Powered Domain Finder</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* Hero */}
          <div className="text-center mb-8">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
              Find Your Perfect Domain
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Combine prefix and suffix word lists, then instantly check availability across multiple TLDs.
            </p>
          </div>

          {/* Options Bar */}
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-5 mb-6">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2 block">Combine Mode</span>
                <div className="flex gap-1.5">
                  {combineModes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setCombineMode(mode.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        combineMode === mode.id
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                          : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:border-white/10 hover:text-slate-300"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-2 block">TLDs ({selectedTLDs.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {defaultTLDs
                    .filter((t) => showAllTLDs || t.popular || selectedTLDs.includes(t.value))
                    .map((tld) => (
                      <button
                        key={tld.value}
                        onClick={() => toggleTLD(tld.value)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                          selectedTLDs.includes(tld.value)
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-white/[0.03] text-slate-500 border-white/[0.06] hover:border-white/10"
                        }`}
                      >
                        {tld.label}
                      </button>
                    ))}
                  <button
                    onClick={() => setShowAllTLDs(!showAllTLDs)}
                    className="text-xs px-2 py-1 rounded-md text-slate-500 hover:text-slate-300 flex items-center gap-0.5 cursor-pointer"
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform ${showAllTLDs ? "rotate-180" : ""}`} />
                    {showAllTLDs ? "Less" : "More"}
                  </button>
                </div>
              </div>
              <div className="flex-1" />
              <div className="self-end">
                <button
                  onClick={handleSearch}
                  disabled={loading || !prefixText.trim() || !suffixText.trim() || selectedTLDs.length === 0}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Checking...</>) : (<><Search className="w-4 h-4" />Search Domains</>)}
                </button>
              </div>
            </div>
          </div>

          {/* Three Column: Prefix | Suffix | Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Column 1: Prefix */}
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-5 hover:border-white/10 transition-colors flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
                  Prefix
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{prefixWords.length}</span>
                  <button
                    onClick={() => openAIModal("prefix")}
                    title="Generate words with AI"
                    className="p-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {prefixPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.words, "prefix")}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/10 hover:border-indigo-500/20 transition-all cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              <textarea
                value={prefixText}
                onChange={(e) => setPrefixText(e.target.value)}
                placeholder={"smart\nai\nneo\ncloud"}
                className="w-full flex-1 min-h-[180px] bg-black/30 border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
              />
            </div>

            {/* Column 2: Suffix */}
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] p-5 hover:border-white/10 transition-colors flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">2</span>
                  Suffix
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{suffixWords.length}</span>
                  <button
                    onClick={() => openAIModal("suffix")}
                    title="Generate words with AI"
                    className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {suffixPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.words, "suffix")}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/10 hover:border-purple-500/20 transition-all cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
              <textarea
                value={suffixText}
                onChange={(e) => setSuffixText(e.target.value)}
                placeholder={"hub\nlab\napp\nio"}
                className="w-full flex-1 min-h-[180px] bg-black/30 border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition-all"
              />
            </div>

            {/* Column 3: Results */}
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col">
              <div className="p-5 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
                    Results
                  </label>
                  {searched && results.length > 0 && (
                    <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg border border-white/[0.06] p-0.5">
                      {(["available", "all", "taken"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilter(f)}
                          className={`text-[11px] px-2 py-1 rounded-md transition-all capitalize cursor-pointer flex items-center gap-1 ${
                            filter === f ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {f === "available" && <Eye className="w-3 h-3" />}
                          {f === "taken" && <EyeOff className="w-3 h-3" />}
                          {f}
                          {f === "available" && availableCount > 0 && <span className="text-emerald-400">({availableCount})</span>}
                          {f === "taken" && takenCount > 0 && <span className="text-red-400/60">({takenCount})</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {searched && results.length > 0 && (
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500">Total: <span className="text-white">{results.length}</span></span>
                    <span className="text-emerald-400/80 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{availableCount}</span>
                    <span className="text-red-400/60 flex items-center gap-1"><XCircle className="w-3 h-3" />{takenCount}</span>
                  </div>
                )}
                {!searched && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Tag className="w-3 h-3" />
                    <span>{combinations.length} names × {selectedTLDs.length} TLDs = {combinations.length * selectedTLDs.length} domains</span>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[600px]">
                {!searched ? (
                  <div className="flex items-center justify-center h-full min-h-[300px]">
                    <div className="text-center">
                      <Search className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                      <p className="text-sm text-slate-600">Search to see results</p>
                    </div>
                  </div>
                ) : results.length === 0 && loading ? (
                  <div className="flex items-center justify-center h-full min-h-[300px]">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-400" />
                      <p className="text-sm text-slate-400">Checking availability...</p>
                    </div>
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="flex items-center justify-center h-full min-h-[300px]">
                    <p className="text-sm text-slate-500">No {filter} domains found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.03]">
                    <AnimatePresence>
                      {filteredResults.map((result, idx) => (
                        <motion.a
                          key={result.domain}
                          href={`https://www.namecheap.com/domains/registration/results/?domain=${result.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(idx * 0.015, 0.5) }}
                          className={`flex items-center justify-between px-5 py-2.5 hover:bg-white/[0.03] transition-colors group ${!result.available ? "opacity-40" : ""}`}
                        >
                          <div className="flex items-center min-w-0">
                            <span className="font-medium text-sm truncate group-hover:text-indigo-400 transition-colors">
                              {result.domain}
                            </span>
                            {result.isPremium && (
                              <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/20 font-medium shrink-0">PREMIUM</span>
                            )}
                          </div>
                          {result.available ? (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400/80 border border-red-500/15">
                              <XCircle className="w-3 h-3" />
                            </span>
                          )}
                        </motion.a>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] mt-16">
          <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-slate-600">
            <span>DomainForge - Find your perfect domain</span>
          </div>
        </footer>
      </div>
    </div>
  );
}