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

const GOLD = "#D4AF37";
const cardBorder = `${GOLD}33`;

const buttonPrimary = {
  backgroundColor: "#000",
  color: GOLD,
} as React.CSSProperties;
const buttonOutline = {
  backgroundColor: "#fff",
  color: "#000",
  borderColor: `${GOLD}80`,
} as React.CSSProperties;

// Tabs
type TabKey = "text" | "image" | "system";

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
        timeoutMs: 5000,
        maxAttempts: 12,
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
      const { request_id } = await enqueueImage(imageFile);
      const result = await waitForImageResult(request_id, {
        timeoutMs: 5000,
        maxAttempts: 12,
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
        timeoutMs: 5000,
        maxAttempts: 10,
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
        timeoutMs: 5000,
        maxAttempts: 10,
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
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: GOLD }}
            >
              Moderation Playground
            </h1>
            <p className="mt-1 text-sm text-neutral-700">
              ทดสอบคิวสำหรับตรวจสอบข้อความและรูปภาพ พร้อม Health/Config
            </p>
          </div>
          <div className="text-xs text-neutral-600">
            Theme:{" "}
            <span className="font-medium" style={{ color: GOLD }}>
              Gold/Black
            </span>
          </div>
        </div>
        <div
          className="mt-3 h-1 w-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveTab("text")}
          className={`rounded-md border px-3 py-2 text-sm font-medium shadow-sm ${activeTab === "text" ? "" : "opacity-80"}`}
          style={{
            borderColor: `${GOLD}88`,
            color: activeTab === "text" ? "#000" : "#333",
            background: activeTab === "text" ? GOLD : "#fff",
          }}
        >
          ข้อความ
        </button>
        <button
          onClick={() => setActiveTab("image")}
          className={`rounded-md border px-3 py-2 text-sm font-medium shadow-sm ${activeTab === "image" ? "" : "opacity-80"}`}
          style={{
            borderColor: `${GOLD}88`,
            color: activeTab === "image" ? "#000" : "#333",
            background: activeTab === "image" ? GOLD : "#fff",
          }}
        >
          รูปภาพ
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`rounded-md border px-3 py-2 text-sm font-medium shadow-sm ${activeTab === "system" ? "" : "opacity-80"}`}
          style={{
            borderColor: `${GOLD}88`,
            color: activeTab === "system" ? "#000" : "#333",
            background: activeTab === "system" ? GOLD : "#fff",
          }}
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
                <h2 className="text-lg font-semibold" style={{ color: GOLD }}>
                  Text Moderation
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value as any)}
                    className="rounded-md border bg-white px-2.5 py-1.5 text-sm shadow-sm focus:outline-none"
                    style={{ borderColor: `${GOLD}66` }}
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
                            borderColor: `${GOLD}80`,
                            borderTopColor: GOLD,
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
                className="w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:outline-none"
                style={{ borderColor: `${GOLD}66` }}
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
            </div>

            {/* Results */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: GOLD }}>
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
                          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
                          style={{ borderColor: `${GOLD}66` }}
                        >
                          <span
                            className="inline-block h-1.5 w-16 overflow-hidden rounded-full"
                            style={{ backgroundColor: `#e5e5e5` }}
                          >
                            <span
                              className="block h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(0, l.score * 100))}%`,
                                backgroundColor: GOLD,
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
                      className="border-b px-3 py-2 text-xs font-medium"
                      style={{ borderColor: cardBorder, color: GOLD }}
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
                <h2 className="text-lg font-semibold" style={{ color: GOLD }}>
                  Image Moderation
                </h2>
                <div className="flex items-center gap-2">
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
                            borderColor: `${GOLD}80`,
                            borderTopColor: GOLD,
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
                  borderColor: isDraggingOver ? `${GOLD}88` : `${GOLD}66`,
                  backgroundColor: isDraggingOver ? `#fffbe6` : undefined,
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
                  <span
                    className="max-w-full overflow-hidden rounded-md border px-3 py-1.5 text-sm shadow-sm"
                    style={{ borderColor: `${GOLD}66` }}
                  >
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
                    รองรับไฟล์รูปภาพ (ควรย่อขนาดให้เหมาะสม)
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
                <span className="text-sm font-medium" style={{ color: GOLD }}>
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
                    <div className="space-y-2">
                      {Object.entries(imageResult.labels)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([name, score]) => (
                          <div key={name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-neutral-800">
                                {name}
                              </span>
                              <span className="tabular-nums text-neutral-500">
                                {formatPercent(score)}
                              </span>
                            </div>
                            <div
                              className="h-2 w-full overflow-hidden rounded-full"
                              style={{ backgroundColor: `#e5e5e5` }}
                            >
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, Math.max(0, score * 100))}%`,
                                  backgroundColor: GOLD,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : null}

                  <div
                    className="overflow-hidden rounded-lg border bg-neutral-50"
                    style={{ borderColor: cardBorder }}
                  >
                    <div
                      className="border-b px-3 py-2 text-xs font-medium"
                      style={{ borderColor: cardBorder, color: GOLD }}
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
            <h2 className="text-lg font-semibold" style={{ color: GOLD }}>
              System
            </h2>
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
                      style={{ borderColor: `${GOLD}80`, borderTopColor: GOLD }}
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
                      style={{ borderColor: `${GOLD}80`, borderTopColor: GOLD }}
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
                className="border-b px-3 py-2 text-xs font-medium"
                style={{ borderColor: cardBorder, color: GOLD }}
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
                className="border-b px-3 py-2 text-xs font-medium"
                style={{ borderColor: cardBorder, color: GOLD }}
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
