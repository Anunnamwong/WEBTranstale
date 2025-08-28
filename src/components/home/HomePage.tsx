import React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  translate,
  translateLongText,
  detectLanguage,
  getLanguages,
  type Language,
} from "@/services/translateService";

type LangCode = "th" | "en" | "ru";

const DEFAULT_LANGS: Language[] = [
  { code: "th", name: "Thai" },
  { code: "en", name: "English" },
  { code: "ru", name: "Russian" },
];

const HomePage = () => {
  const [langs, setLangs] = useState<Language[]>(DEFAULT_LANGS);
  const [sourceLang, setSourceLang] = useState<LangCode | "auto">("auto");
  const [targetLang, setTargetLang] = useState<LangCode>("en");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const srcRef = useRef<HTMLTextAreaElement | null>(null);
  const outRef = useRef<HTMLTextAreaElement | null>(null);
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await getLanguages();
        if (data && data.length >= 3) setLangs(data);
      } catch (_) {
        // ignore, fall back to DEFAULT_LANGS
      }
    })();
  }, []);

  const resizeTextarea = (
    el: HTMLTextAreaElement | null,
    maxPx: number = Infinity
  ) => {
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, maxPx);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > next ? "auto" : "hidden";
  };

  useEffect(() => {
    resizeTextarea(srcRef.current);
  }, [sourceText]);

  useEffect(() => {
    resizeTextarea(outRef.current);
  }, [translatedText]);

  const canTranslate = useMemo(() => {
    return (
      !!sourceText.trim() &&
      !!targetLang &&
      (sourceLang === "auto" || !!sourceLang)
    );
  }, [sourceText, sourceLang, targetLang]);

  const onSwap = () => {
    setError(null);
    setTranslatedText("");
    if (sourceLang === "auto") return;
    const newSource = targetLang as LangCode;
    const newTarget = sourceLang as LangCode;
    setSourceLang(newSource);
    setTargetLang(newTarget);
    setSourceText(translatedText || sourceText);
    setTranslatedText("");
  };

  const onDetect = async () => {
    if (!sourceText.trim()) return;
    setError(null);
    try {
      const t0 = performance.now();
      const res = await detectLanguage(sourceText);
      const first = Array.isArray(res) ? res[0] : res;
      const guessLang = (txt: string): LangCode => {
        const hasThai = /[\u0E00-\u0E7F]/.test(txt);
        const hasCyr = /[\u0400-\u04FF]/.test(txt);
        if (hasThai) return "th";
        if (hasCyr) return "ru";
        return "en";
      };
      if (first) {
        const apiLang = first.language as string as LangCode | "und";
        if (apiLang === "th" || apiLang === "en" || apiLang === "ru") {
          setSourceLang(apiLang);
        } else {
          setSourceLang(guessLang(sourceText));
        }
      } else {
        setSourceLang(guessLang(sourceText));
      }
      setLastDurationMs(Math.max(0, Math.round(performance.now() - t0)));
    } catch (e) {
      // Fallback heuristic if API fails
      const hasText = sourceText.trim();
      if (hasText) {
        const hasThai = /[\u0E00-\u0E7F]/.test(sourceText);
        const hasCyr = /[\u0400-\u04FF]/.test(sourceText);
        setSourceLang(hasThai ? "th" : hasCyr ? "ru" : "en");
      } else {
        setError("Detect failed");
      }
    }
  };

  const onTranslate = async () => {
    if (!canTranslate) return;
    setLoading(true);
    setError(null);
    setTranslatedText("");
    try {
      const t0 = performance.now();
      const isLong = sourceText.length > 3000;
      if (isLong) {
        const out = await translateLongText(
          sourceText,
          sourceLang as any,
          targetLang
        );
        setTranslatedText(out);
      } else {
        const res = await translate({
          q: sourceText,
          source: sourceLang as any,
          target: targetLang,
          format: "text",
        });
        const out =
          typeof res.translatedText === "string"
            ? res.translatedText
            : res.translatedText?.[0] || "";
        setTranslatedText(out);
      }
      setLastDurationMs(Math.max(0, Math.round(performance.now() - t0)));
    } catch (e: any) {
      setError(e?.message || "Translate failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">Mini Translator</h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          <div className="md:col-span-5 bg-white rounded-lg border p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <select
                className="select select-bordered px-3 py-2 rounded-md border-gray-300"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value as any)}
              >
                <option value="auto">Auto Detect</option>
                {langs.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
              <button
                className="text-sm  hover:bg-blue-700 bg-blue-600 text-white px-4 py-2 rounded-md"
                onClick={onDetect}
                disabled={!sourceText.trim()}
              >
                Detect language
              </button>
            </div>
            <textarea
              ref={srcRef}
              className="w-full resize-none outline-none rounded-md border border-gray-200 p-3 text-sm overflow-hidden"
              rows={3}
              placeholder="Enter text"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onInput={(e) => resizeTextarea(e.currentTarget)}
            />
            <div className="mt-2 text-xs text-gray-500">
              {sourceText.length} chars
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-center">
            <button
              className="inline-flex items-center justify-center rounded-full border bg-white shadow px-3 py-3 hover:bg-gray-50"
              onClick={onSwap}
              title="Swap languages"
            >
              <span className="text-lg">⇄</span>
            </button>
          </div>

          <div className="md:col-span-5 bg-white rounded-lg border p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <select
                className="select select-bordered px-3 py-2 rounded-md border-gray-300"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value as LangCode)}
              >
                {langs.map((l) => (
                  <option key={l.code} value={l.code as LangCode}>
                    {l.name}
                  </option>
                ))}
              </select>
              <button
                className="ml-auto inline-flex items-center gap-2 rounded-md bg-blue-600 text-white text-sm px-4 py-2 disabled:opacity-50 hover:bg-blue-700"
                onClick={onTranslate}
                disabled={!canTranslate || loading}
              >
                {loading ? "Translating..." : "Translate"}
              </button>
              {lastDurationMs != null && (
                <span className="text-xs text-gray-500 ml-2">
                  {lastDurationMs >= 1000
                    ? `${(lastDurationMs / 1000).toFixed(1)}s`
                    : `${lastDurationMs}ms`}{" "}
                  (client)
                </span>
              )}
            </div>
            <textarea
              ref={outRef}
              className="w-full resize-none outline-none rounded-md border border-gray-200 p-3 text-sm bg-gray-50 overflow-hidden"
              rows={3}
              placeholder="Translation"
              value={translatedText}
              readOnly
            />
            <div className="mt-2 text-xs text-gray-500">
              {translatedText.length} chars
            </div>
          </div>
        </div>

        {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default HomePage;
