"use client";

import React, { useMemo, useState } from "react";
import {
  enqueueText,
  waitForTextResult,
  enqueueImage,
  waitForImageResult,
  enqueueHealth,
  waitForHealthResult,
  enqueueConfig,
  waitForConfigResult,
  TextResult,
  ImageResult,
} from "@/services/moderationServices";

function formatPercent(score?: number) {
  if (typeof score !== "number") return "-";
  return `${(score * 100).toFixed(1)}%`;
}

// Accent & tokens (modern neutral/indigo)
const ACCENT = "#4F46E5"; // indigo-600
const cardBorder = `${ACCENT}1F`;

const buttonPrimary = {
  backgroundColor: ACCENT,
  color: "#ffffff",
} as React.CSSProperties;
const buttonOutline = {
  backgroundColor: "#ffffff",
  color: "#111827",
  borderColor: "#CBD5E1",
} as React.CSSProperties;

// Tabs
type TabKey = "text" | "image" | "system";

// Client-side downscale + compress to limit
async function downscaleAndCompressToLimit(
  file: File,
  opts: { maxBytes: number; maxSide: number; minQuality?: number }
): Promise<File> {
  const minQuality = Math.max(0.4, Math.min(1, opts.minQuality ?? 0.6));
  // If already under size, return early
  if (file.size <= opts.maxBytes) return file;

  const imgUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = imgUrl;
    });

    let { width, height } = img;
    const scale = Math.min(1, opts.maxSide / Math.max(width, height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.9;
    let blob: Blob | null = await new Promise((r) =>
      canvas.toBlob(r, "image/jpeg", quality)
    );
    if (!blob) return file;

    // Reduce quality progressively until under cap or reach minQuality
    while (blob.size > opts.maxBytes && quality > minQuality) {
      quality = Math.max(minQuality, quality - 0.1);
      const next = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, "image/jpeg", quality)
      );
      if (!next) break;
      blob = next;
      if (quality <= minQuality) break;
    }

    if (blob.size <= opts.maxBytes) {
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
        type: "image/jpeg",
      });
    }
    // If still large, return original and let backend try its own downscale
    return file;
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

const ModerationClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("text");

  const [textInput, setTextInput] = useState("");
  const [lang, setLang] = useState<"auto" | "en" | "ru" | "th">("auto");
  const [textLoading, setTextLoading] = useState(false);
  const [textResult, setTextResult] = useState<TextResult | null>(null);
  const [textError, setTextError] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<ImageResult | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [imageLang, setImageLang] = useState<"en" | "th" | "ru">("en");

  const [healthLoading, setHealthLoading] = useState(false);
  const [healthResult, setHealthResult] = useState<any>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [configLoading, setConfigLoading] = useState(false);
  const [configResult, setConfigResult] = useState<any>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  const imagePreviewUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : ""),
    [imageFile]
  );

  // Batch test (text)
  type BatchItem = {
    index: number;
    requestId?: string;
    status: "queued" | "waiting" | "done" | "error";
    doneOrder?: number;
    error?: string;
  };
  const [batchCount, setBatchCount] = useState<number>(5);
  const [batchDelayMs, setBatchDelayMs] = useState<number>(0);
  const [batchText, setBatchText] = useState<string>("Batch test message");
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchCompleteCount, setBatchCompleteCount] = useState(0);

  function resetText() {
    setTextInput("");
    setTextResult(null);
    setTextError(null);
  }
  function resetImage() {
    setImageFile(null);
    setImageResult(null);
    setImageError(null);
  }

  async function onModerateText() {
    setTextLoading(true);
    setTextError(null);
    setTextResult(null);
    try {
      const { request_id } = await enqueueText(textInput, lang, true);
      const result = await waitForTextResult(request_id, {
        timeoutMs: 15000,
        maxAttempts: 8,
      });
      setTextResult(result);
    } catch (e: any) {
      setTextError(e?.message || "Error");
    } finally {
      setTextLoading(false);
    }
  }

  async function onModerateImage() {
    if (!imageFile) {
      setImageError("กรุณาเลือกรูปภาพ");
      return;
    }
    setImageLoading(true);
    setImageError(null);
    setImageResult(null);
    try {
      // Prepare client-side downscale/compress using backend config when available
      let fileToSend = imageFile;
      const maxBytes = configResult?.max_image_mb
        ? Number(configResult.max_image_mb) * 1024 * 1024
        : 10 * 1024 * 1024;
      const modelSide = configResult?.model_image_size
        ? Number(configResult.model_image_size)
        : 224;
      const maxSide = Math.max(512, modelSide * 2);
      try {
        fileToSend = await downscaleAndCompressToLimit(imageFile, {
          maxBytes,
          maxSide,
          minQuality: 0.6,
        });
      } catch {}

      const { request_id } = await enqueueImage(fileToSend, {
        lang: imageLang,
      });
      const result = await waitForImageResult(request_id, {
        timeoutMs: 15000,
        maxAttempts: 8,
      });
      setImageResult(result);
    } catch (e: any) {
      setImageError(e?.message || "Error");
    } finally {
      setImageLoading(false);
    }
  }

  async function onCheckHealth() {
    setHealthLoading(true);
    setHealthError(null);
    setHealthResult(null);
    try {
      const { request_id } = await enqueueHealth();
      const result = await waitForHealthResult(request_id, {
        timeoutMs: 15000,
        maxAttempts: 8,
      });
      setHealthResult(result);
    } catch (e: any) {
      setHealthError(e?.message || "Error");
    } finally {
      setHealthLoading(false);
    }
  }

  async function onFetchConfig() {
    setConfigLoading(true);
    setConfigError(null);
    setConfigResult(null);
    try {
      const { request_id } = await enqueueConfig();
      const result = await waitForConfigResult(request_id, {
        timeoutMs: 15000,
        maxAttempts: 8,
      });
      setConfigResult(result);
    } catch (e: any) {
      setConfigError(e?.message || "Error");
    } finally {
      setConfigLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">
              Moderation Playground
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              ทดสอบคิวสำหรับตรวจสอบข้อความและรูปภาพ พร้อม Health/Config
            </p>
          </div>
          <div className="text-xs text-neutral-500">Modern</div>
        </div>
        <div
          className="mt-3 h-1 w-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${ACCENT}, transparent)`,
          }}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab("text")}
          className={`rounded-md border px-3 py-2 text-sm font-medium shadow-sm ${activeTab === "text" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50"}`}
        >
          ข้อความ
        </button>
        <button
          onClick={() => setActiveTab("image")}
          className={`rounded-md border px-3 py-2 text-sm font-medium shadow-sm ${activeTab === "image" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50"}`}
        >
          รูปภาพ
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`rounded-md border px-3 py-2 text-sm font-medium shadow-sm ${activeTab === "system" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50"}`}
        >
          System
        </button>
      </div>

      {/* Panels */}
      {activeTab === "text" ? (
        <section
          className="rounded-xl border bg-white p-6 shadow-sm"
          style={{ borderColor: cardBorder }}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Controls */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Text Moderation
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value as any)}
                    className="rounded-md border bg-white px-2.5 py-1.5 text-sm shadow-sm focus:outline-none border-neutral-300"
                  >
                    <option value="auto">auto</option>
                    <option value="en">en</option>
                    <option value="ru">ru</option>
                    <option value="th">th</option>
                  </select>
                  <button
                    onClick={onModerateText}
                    disabled={textLoading || !textInput.trim()}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    style={buttonPrimary}
                  >
                    {textLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-3 w-3 animate-spin rounded-full border-2"
                          style={{
                            borderColor: `#ffffff99`,
                            borderTopColor: `#ffffff`,
                          }}
                        />
                        กำลังรอผล...
                      </span>
                    ) : (
                      "Moderate"
                    )}
                  </button>
                  <button
                    onClick={resetText}
                    disabled={textLoading}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    style={buttonOutline}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={10}
                placeholder="พิมพ์ข้อความเพื่อทดสอบ moderation"
                className="w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:outline-none border-neutral-300"
              />

              {textError ? (
                <div
                  className="mt-3 rounded-md border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: `#FDECEC`,
                    borderColor: `#F5B5B5`,
                    color: `#8A1C1C`,
                  }}
                >
                  {textError}
                </div>
              ) : null}

              {/* Batch Test */}
              <div
                className="mt-6 rounded-xl border bg-white p-4"
                style={{ borderColor: cardBorder }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Batch Test (ข้อความ)
                  </h3>
                  <button
                    onClick={async () => {
                      if (batchRunning) return;
                      setBatchRunning(true);
                      setBatchCompleteCount(0);
                      const init: BatchItem[] = Array.from(
                        { length: Math.max(1, batchCount) },
                        (_, i) => ({ index: i + 1, status: "queued" })
                      );
                      setBatchItems(init);
                      const localItems = [...init];
                      // Enqueue all
                      for (let i = 0; i < localItems.length; i++) {
                        try {
                          const payload = `${batchText} #${localItems[i].index}`;
                          const { request_id } = await enqueueText(
                            payload,
                            "auto",
                            true
                          );
                          localItems[i] = {
                            ...localItems[i],
                            requestId: request_id,
                            status: "waiting",
                          };
                          setBatchItems([...localItems]);
                          if (batchDelayMs > 0)
                            await new Promise((r) =>
                              setTimeout(r, batchDelayMs)
                            );
                        } catch (e: any) {
                          localItems[i] = {
                            ...localItems[i],
                            status: "error",
                            error: e?.message || "enqueue error",
                          };
                          setBatchItems([...localItems]);
                        }
                      }
                      // Wait for results concurrently
                      let completeOrder = 0;
                      await Promise.all(
                        localItems.map(async (item, idx) => {
                          if (!item.requestId) return;
                          try {
                            const res = await waitForTextResult(
                              item.requestId,
                              { timeoutMs: 15000, maxAttempts: 8 }
                            );
                            completeOrder += 1;
                            localItems[idx] = {
                              ...localItems[idx],
                              status: "done",
                              doneOrder: completeOrder,
                            };
                            setBatchItems([...localItems]);
                            setBatchCompleteCount(completeOrder);
                          } catch (e: any) {
                            localItems[idx] = {
                              ...localItems[idx],
                              status: "error",
                              error: e?.message || "wait error",
                            };
                            setBatchItems([...localItems]);
                          }
                        })
                      );
                      setBatchRunning(false);
                    }}
                    disabled={batchRunning}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    style={buttonPrimary}
                  >
                    {batchRunning ? "กำลังทดสอบ..." : "Run Batch"}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="text-xs text-neutral-700">
                    Count
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={batchCount}
                      onChange={(e) =>
                        setBatchCount(Number(e.target.value) || 1)
                      }
                      className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs text-neutral-700">
                    Delay ms
                    <input
                      type="number"
                      min={0}
                      max={5000}
                      value={batchDelayMs}
                      onChange={(e) =>
                        setBatchDelayMs(Number(e.target.value) || 0)
                      }
                      className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs text-neutral-700 sm:col-span-1 col-span-1">
                    Base text
                    <input
                      type="text"
                      value={batchText}
                      onChange={(e) => setBatchText(e.target.value)}
                      className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-1 text-sm"
                    />
                  </label>
                </div>
                <div
                  className="mt-3 overflow-auto rounded-md border"
                  style={{ borderColor: cardBorder }}
                >
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-3 py-2 font-medium text-neutral-700">
                          #
                        </th>
                        <th className="px-3 py-2 font-medium text-neutral-700">
                          request_id
                        </th>
                        <th className="px-3 py-2 font-medium text-neutral-700">
                          status
                        </th>
                        <th className="px-3 py-2 font-medium text-neutral-700">
                          done order
                        </th>
                        <th className="px-3 py-2 font-medium text-neutral-700">
                          ok?
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchItems.map((it) => {
                        const ok =
                          it.status === "done"
                            ? it.doneOrder === it.index
                            : null;
                        return (
                          <tr
                            key={it.index}
                            className="border-t"
                            style={{ borderColor: cardBorder }}
                          >
                            <td className="px-3 py-2">{it.index}</td>
                            <td
                              className="px-3 py-2 font-mono text-[11px] truncate max-w-[180px]"
                              title={it.requestId}
                            >
                              {it.requestId || "-"}
                            </td>
                            <td className="px-3 py-2">{it.status}</td>
                            <td className="px-3 py-2">{it.doneOrder || "-"}</td>
                            <td className="px-3 py-2">
                              {ok === null ? "-" : ok ? "✔" : "✖"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs text-neutral-600">
                  Completed: {batchCompleteCount}/{batchItems.length}
                </div>
              </div>
            </div>

            {/* Results */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-900">
                  ผลลัพธ์
                </span>
                {textResult?.top_labels?.length ? (
                  <span className="text-xs text-neutral-600">
                    Top labels: {textResult.top_labels.length}
                  </span>
                ) : null}
              </div>
              {textResult ? (
                <div className="space-y-4">
                  {/* Chips */}
                  {textResult.top_labels?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {textResult.top_labels.slice(0, 8).map((l) => (
                        <span
                          key={l.name}
                          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium border-neutral-300 bg-white text-neutral-800"
                        >
                          <span className="inline-block h-1.5 w-16 overflow-hidden rounded-full bg-neutral-200">
                            <span
                              className="block h-1.5 rounded-full bg-indigo-600"
                              style={{
                                width: `${Math.min(100, Math.max(0, l.score * 100))}%`,
                              }}
                            />
                          </span>
                          {l.name}
                          <span className="tabular-nums text-[10px] text-neutral-500">
                            {formatPercent(l.score)}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {/* JSON */}
                  <div
                    className="overflow-hidden rounded-lg border bg-neutral-50"
                    style={{ borderColor: cardBorder }}
                  >
                    <div
                      className="border-b px-3 py-2 text-xs font-medium text-neutral-700"
                      style={{ borderColor: cardBorder }}
                    >
                      Result JSON
                    </div>
                    <pre className="max-h-[520px] overflow-auto p-3 text-[12px] leading-relaxed">
                      {JSON.stringify(textResult, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">ผลลัพธ์จะปรากฏที่นี่</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "image" ? (
        <section
          className="rounded-xl border bg-white p-6 shadow-sm"
          style={{ borderColor: cardBorder }}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Controls */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Image Moderation
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={imageLang}
                    onChange={(e) =>
                      setImageLang(e.target.value as "en" | "th" | "ru")
                    }
                    className="rounded-md border bg-white px-2.5 py-1.5 text-sm shadow-sm focus:outline-none border-neutral-300"
                    aria-label="Image language"
                  >
                    <option value="en">en</option>
                    <option value="th">th</option>
                    <option value="ru">ru</option>
                  </select>
                  <button
                    onClick={onModerateImage}
                    disabled={imageLoading || !imageFile}
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    style={buttonPrimary}
                  >
                    {imageLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-3 w-3 animate-spin rounded-full border-2"
                          style={{
                            borderColor: `#ffffff99`,
                            borderTopColor: `#ffffff`,
                          }}
                        />
                        กำลังรอผล...
                      </span>
                    ) : (
                      "Moderate Image"
                    )}
                  </button>
                  <button
                    onClick={resetImage}
                    disabled={imageLoading}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    style={buttonOutline}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Dropzone */}
              <div
                className="rounded-lg border border-dashed p-5 text-center"
                style={{
                  borderColor: isDraggingOver ? `#A5B4FC` : `#E5E7EB`,
                  backgroundColor: isDraggingOver ? `#EEF2FF` : undefined,
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={() => setIsDraggingOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) setImageFile(f);
                }}
              >
                <p className="text-sm text-neutral-700">
                  ลากไฟล์มาวางที่นี่ หรือ
                </p>
                <label className="mt-2 inline-flex flex-col items-center gap-2 sm:flex-row sm:items-center">
                  <span className="max-w-full overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-sm border-neutral-300">
                    <input
                      type="file"
                      accept="image/*"
                      className="max-w-[240px]"
                      onChange={(e) =>
                        setImageFile(e.target.files?.[0] || null)
                      }
                    />
                  </span>
                  <span className="text-center text-xs text-neutral-500 sm:text-left">
                    รองรับไฟล์รูปภาพ (ระบบจะย่อ/บีบอัดอัตโนมัติหากเกินเพดาน;
                    ยังเกินจะได้ 413)
                  </span>
                </label>
              </div>

              {imageError ? (
                <div
                  className="mt-3 rounded-md border px-3 py-2 text-sm"
                  style={{
                    backgroundColor: `#FDECEC`,
                    borderColor: `#F5B5B5`,
                    color: `#8A1C1C`,
                  }}
                >
                  {imageError}
                </div>
              ) : null}

              {imagePreviewUrl ? (
                <div className="mt-4">
                  <img
                    src={imagePreviewUrl}
                    alt="preview"
                    className="w-full max-h-72 rounded-lg border object-contain"
                    style={{ borderColor: cardBorder }}
                  />
                </div>
              ) : null}
            </div>

            {/* Results */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-900">
                  ผลลัพธ์
                </span>
                {imageResult?.labels ? (
                  <span className="text-xs text-neutral-600">
                    Labels: {Object.keys(imageResult.labels).length}
                  </span>
                ) : null}
              </div>
              {imageResult ? (
                <div className="space-y-4">
                  {imageResult.labels ? (
                    <div className="space-y-1">
                      {Object.entries(imageResult.labels)
                        .slice(0, 20)
                        .map(([name, value]) => (
                          <div
                            key={name}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <span className="font-medium text-neutral-800 min-w-[90px]">
                              {name}
                            </span>
                            <span className="flex-1 text-neutral-700 break-words">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : null}

                  <div
                    className="overflow-hidden rounded-lg border bg-neutral-50"
                    style={{ borderColor: cardBorder }}
                  >
                    <div
                      className="border-b px-3 py-2 text-xs font-medium text-neutral-700"
                      style={{ borderColor: cardBorder }}
                    >
                      Result JSON
                    </div>
                    <pre className="max-h-[520px] overflow-auto p-3 text-[12px] leading-relaxed">
                      {JSON.stringify(imageResult, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-neutral-500">ผลลัพธ์จะปรากฏที่นี่</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "system" ? (
        <section
          className="rounded-xl border bg-white p-6 shadow-sm"
          style={{ borderColor: cardBorder }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-neutral-900">System</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onCheckHealth}
                disabled={healthLoading}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                style={buttonPrimary}
              >
                {healthLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3 w-3 animate-spin rounded-full border-2"
                      style={{
                        borderColor: `#ffffff99`,
                        borderTopColor: `#ffffff`,
                      }}
                    />{" "}
                    กำลังตรวจ...
                  </span>
                ) : (
                  "Queue Health"
                )}
              </button>
              <button
                onClick={onFetchConfig}
                disabled={configLoading}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                style={buttonPrimary}
              >
                {configLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3 w-3 animate-spin rounded-full border-2"
                      style={{
                        borderColor: `#ffffff99`,
                        borderTopColor: `#ffffff`,
                      }}
                    />{" "}
                    กำลังโหลด...
                  </span>
                ) : (
                  "Queue Config"
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div
              className="overflow-hidden rounded-lg border bg-neutral-50"
              style={{ borderColor: cardBorder }}
            >
              <div
                className="border-b px-3 py-2 text-xs font-medium text-neutral-700"
                style={{ borderColor: cardBorder }}
              >
                Health
              </div>
              {healthError ? (
                <div className="p-3 text-sm" style={{ color: `#8A1C1C` }}>
                  {healthError}
                </div>
              ) : null}
              {healthResult ? (
                <pre className="max-h-72 overflow-auto p-3 text-[12px] leading-relaxed">
                  {JSON.stringify(healthResult, null, 2)}
                </pre>
              ) : (
                <p className="p-3 text-xs text-neutral-500">ยังไม่มีข้อมูล</p>
              )}
            </div>
            <div
              className="overflow-hidden rounded-lg border bg-neutral-50"
              style={{ borderColor: cardBorder }}
            >
              <div
                className="border-b px-3 py-2 text-xs font-medium text-neutral-700"
                style={{ borderColor: cardBorder }}
              >
                Config
              </div>
              {configError ? (
                <div className="p-3 text-sm" style={{ color: `#8A1C1C` }}>
                  {configError}
                </div>
              ) : null}
              {configResult ? (
                <pre className="max-h-72 overflow-auto p-3 text-[12px] leading-relaxed">
                  {JSON.stringify(configResult, null, 2)}
                </pre>
              ) : (
                <p className="p-3 text-xs text-neutral-500">ยังไม่มีข้อมูล</p>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default ModerationClient;
