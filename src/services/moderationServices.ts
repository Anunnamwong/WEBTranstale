export const API_BASE: string =
  process.env.NEXT_PUBLIC_MODERATION_API_BASE || "http://localhost:5050";

export type QueueEnqueueResponse = { request_id: string; status: "enqueued" };

// Text moderation types
export type TopLabel = { name: string; score: number };
export type Span = {
  label: string;
  start: number;
  end: number;
  text_preview: string;
  score: number;
};
export type TextResult = {
  id?: string;
  lang: "en" | "ru" | "th" | string;
  labels: Record<string, number>;
  top_labels: TopLabel[];
  spans?: Span[];
  stats: Record<string, number>;
  reason: string;
};

// Image moderation types
export type ImageResult = {
  id?: string;
  labels: Record<string, number>;
  meta: Record<string, unknown>;
};

// Generic helpers
async function parseOrThrow(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json();
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function computeBackoffMs(attempt: number): number {
  const base = Math.min(1000 + attempt * 300, 3000);
  const jitter = Math.floor(Math.random() * 200);
  return base + jitter;
}

function isPendingLike(data: any): boolean {
  return !!(data && (data.status === 'pending' || data.status === 'enqueued'));
}

// Text queue (proxied through Next.js API to avoid CORS)
export async function enqueueText(
  text: string,
  lang: "auto" | "en" | "ru" | "th" = "auto",
  returnSpans: boolean = true
): Promise<QueueEnqueueResponse> {
  const res = await fetch(`/api/queue/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang, return_spans: returnSpans }),
  });
  return parseOrThrow(res);
}

export async function fetchTextResult(
  requestId: string,
  timeoutMs: number = 15000
): Promise<TextResult | null> {
  const res = await fetch(
    `/api/queue/text/${encodeURIComponent(requestId)}`,
    { method: "GET" }
  );
  if (res.status === 404) return null;
  const data = await parseOrThrow(res);
  if (isPendingLike(data)) return null;
  return data as TextResult;
}

export async function waitForTextResult(
  requestId: string,
  options: {
    initialDelayMs?: number;
    timeoutMs?: number;
    maxAttempts?: number;
  } = {}
): Promise<TextResult> {
  const { initialDelayMs = 0, timeoutMs = 15000, maxAttempts = 8 } = options;
  if (initialDelayMs) await sleep(initialDelayMs);
  for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++) {
    const result = await fetchTextResult(requestId, timeoutMs);
    if (result) return result;
    await sleep(computeBackoffMs(attemptIndex));
  }
  throw new Error("Result not ready after max attempts");
}

// Image queue (proxied through Next.js API to avoid CORS)
export async function enqueueImage(file: File): Promise<QueueEnqueueResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`/api/queue/image`, { method: "POST", body: form });
  return parseOrThrow(res);
}

export async function fetchImageResult(
  requestId: string,
  timeoutMs: number = 15000
): Promise<ImageResult | null> {
  const res = await fetch(
    `/api/queue/image/${encodeURIComponent(requestId)}`,
    { method: "GET" }
  );
  if (res.status === 404) return null;
  const data = await parseOrThrow(res);
  if (isPendingLike(data)) return null;
  return data as ImageResult;
}

export async function waitForImageResult(
  requestId: string,
  options: {
    initialDelayMs?: number;
    timeoutMs?: number;
    maxAttempts?: number;
  } = {}
): Promise<ImageResult> {
  const { initialDelayMs = 0, timeoutMs = 15000, maxAttempts = 8 } = options;
  if (initialDelayMs) await sleep(initialDelayMs);
  for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++) {
    const result = await fetchImageResult(requestId, timeoutMs);
    if (result) return result;
    await sleep(computeBackoffMs(attemptIndex));
  }
  throw new Error("Result not ready after max attempts");
}

// Health via queue (proxied through Next.js API to avoid CORS)
export async function enqueueHealth(): Promise<QueueEnqueueResponse> {
  const res = await fetch(`/api/queue/health`, { method: "POST" });
  return parseOrThrow(res);
}

export async function fetchHealthResult(
  requestId: string,
  timeoutMs: number = 15000
): Promise<any | null> {
  const res = await fetch(
    `/api/queue/health/${encodeURIComponent(requestId)}`,
    { method: "GET" }
  );
  if (res.status === 404) return null;
  const data = await parseOrThrow(res);
  if (isPendingLike(data)) return null;
  return data as any;
}

export async function waitForHealthResult(
  requestId: string,
  options: {
    initialDelayMs?: number;
    timeoutMs?: number;
    maxAttempts?: number;
  } = {}
): Promise<any> {
  const { initialDelayMs = 0, timeoutMs = 15000, maxAttempts = 8 } = options;
  if (initialDelayMs) await sleep(initialDelayMs);
  for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++) {
    const result = await fetchHealthResult(requestId, timeoutMs);
    if (result) return result;
    await sleep(computeBackoffMs(attemptIndex));
  }
  throw new Error("Result not ready after max attempts");
}

// Config via queue (proxied through Next.js API to avoid CORS)
export async function enqueueConfig(): Promise<QueueEnqueueResponse> {
  const res = await fetch(`/api/queue/config`, { method: "POST" });
  return parseOrThrow(res);
}

export async function fetchConfigResult(
  requestId: string,
  timeoutMs: number = 15000
): Promise<any | null> {
  const res = await fetch(
    `/api/queue/config/${encodeURIComponent(requestId)}`,
    { method: "GET" }
  );
  if (res.status === 404) return null;
  const data = await parseOrThrow(res);
  if (isPendingLike(data)) return null;
  return data as any;
}

export async function waitForConfigResult(
  requestId: string,
  options: {
    initialDelayMs?: number;
    timeoutMs?: number;
    maxAttempts?: number;
  } = {}
): Promise<any> {
  const { initialDelayMs = 0, timeoutMs = 15000, maxAttempts = 8 } = options;
  if (initialDelayMs) await sleep(initialDelayMs);
  for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++) {
    const result = await fetchConfigResult(requestId, timeoutMs);
    if (result) return result;
    await sleep(computeBackoffMs(attemptIndex));
  }
  throw new Error("Result not ready after max attempts");
}
