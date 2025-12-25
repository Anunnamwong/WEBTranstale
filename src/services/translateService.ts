import axios from 'axios';

export type Language = {
  code: 'en' | 'ru' | 'th';
  name: string;
};

export type DetectResponse = {
  language: 'en' | 'ru' | 'th' | 'und';
  confidence: number;
};

export type TranslateRequest = {
  q: string | string[];
  source: 'auto' | 'en' | 'ru' | 'th';
  target: 'en' | 'ru' | 'th';
  format?: 'text' | 'html';
  alternatives?: number;
};

export type TranslateResponse = {
  translatedText: string | string[];
  detectedLanguage?: DetectResponse | null;
  alternatives?: string[] | string[][];
  preIssues?: unknown;
  postIssues?: unknown;
};

export const STATIC_LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Russian' },
  { code: 'th', name: 'Thai' },
];

export function getLanguages(): Language[] {
  return STATIC_LANGUAGES;
}

// Use Next.js API routes to avoid CORS in browser
const client = axios.create({ baseURL: '/api', timeout: 180000 });

export async function detectLanguage(q: string | string[]) {
  const { data } = await client.post<DetectResponse[] | DetectResponse>(
    '/detect',
    { q }
  );
  return data;
}

export async function translate(body: TranslateRequest, options?: { distributed?: boolean }) {
  const headers: Record<string, string> = {};
  if (options?.distributed) {
    headers['x-distributed'] = 'true';
  }
  const { data } = await client.post<TranslateResponse>('/translate', body, { headers });
  return data;
}

// Helper: chunk long text to avoid server-side token limits; stitches output
export async function translateLongText(
  text: string,
  source: TranslateRequest['source'],
  target: TranslateRequest['target'],
  opts?: { maxCharsPerChunk?: number; distributed?: boolean }
) {
  const max = Math.max(2000, Math.min(8000, opts?.maxCharsPerChunk || 4000));
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(text.length, i + max);
    // try to cut at sentence boundary
    const slice = text.slice(i, end);
    const lastStop = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('\n'));
    if (end < text.length && lastStop > 200) {
      end = i + lastStop + 1;
    }
    chunks.push(text.slice(i, end));
    i = end;
  }
  const results: string[] = [];
  for (const ch of chunks) {
    const res = await translate({ q: ch, source, target, format: 'text' }, { distributed: opts?.distributed });
    results.push(typeof res.translatedText === 'string' ? res.translatedText : (res.translatedText as string[])[0]);
  }
  // naive join with newline
  return results.join('\n');
}

export async function getQueueStatus() {
  const { data } = await client.get('/queue-status');
  return data as any;
}

export async function translateDistributed(body: TranslateRequest) {
  const headers: Record<string, string> = { 'x-distributed': 'true' };
  const { data } = await client.post<any>('/translate', body, { headers });
  return data as { status: string; job_id?: string };
}

export async function getTranslateStatus(jobId: string) {
  const { data } = await client.get(`/translate-status/${jobId}`);
  return data as any;
}

// LLM Model options
export type LlmModel = 
  | 'openai/gpt-oss-120b'
  | 'openai-gpt-oss-20b'
  | 'gpt-4o-mini'
  | 'gpt-5-mini'
  | 'gemini-2.5-pro';

// Queue-based translation API
export type QueueTranslateRequest = {
  q: string | string[];
  source: 'auto' | 'en' | 'ru' | 'th';
  target: 'en' | 'ru' | 'th';
  format?: 'text' | 'html';
  alternatives?: number;
  model?: LlmModel; // For LLM translate only
};

export type QueueTranslateResponse = {
  request_id: string;
  status: 'enqueued' | 'pending' | 'completed' | 'failed';
  message?: string;
  translatedText?: string | string[];
  success?: boolean;
  error?: string;
  retry_after_ms?: number;
};

export async function queueTranslate(body: QueueTranslateRequest): Promise<QueueTranslateResponse> {
  const { data } = await client.post<QueueTranslateResponse>('/queue/translate', body);
  return data;
}

export async function getQueueTranslateResult(requestId: string): Promise<QueueTranslateResponse> {
  try {
    const { data } = await client.get<QueueTranslateResponse>(`/queue/translate/${requestId}`);
    return data;
  } catch (error: any) {
    // If 404, return pending status (not ready yet)
    if (error?.response?.status === 404) {
      return {
        request_id: requestId,
        status: 'pending',
        success: false,
      };
    }
    throw error;
  }
}

export async function queueLlmTranslate(
  body: QueueTranslateRequest & { model?: LlmModel }
): Promise<QueueTranslateResponse> {
  const { data } = await client.post<QueueTranslateResponse>('/queue/llm/translate', body);
  return data;
}

export async function getQueueLlmTranslateResult(requestId: string): Promise<QueueTranslateResponse> {
  try {
    const { data } = await client.get<QueueTranslateResponse>(`/queue/llm/translate/${requestId}`);
    return data;
  } catch (error: any) {
    // If 404, return pending status (not ready yet)
    if (error?.response?.status === 404) {
      return {
        request_id: requestId,
        status: 'pending',
        success: false,
      };
    }
    throw error;
  }
}

export async function queueNovitaTranslate(
  body: QueueTranslateRequest & { model?: LlmModel }
): Promise<QueueTranslateResponse> {
  const { data } = await client.post<QueueTranslateResponse>('/queue/novita/translate', body);
  return data;
}

export async function getQueueNovitaTranslateResult(requestId: string): Promise<QueueTranslateResponse> {
  try {
    const { data } = await client.get<QueueTranslateResponse>(`/queue/novita/translate/${requestId}`);
    return data;
  } catch (error: any) {
    // If 404, return pending status (not ready yet)
    if (error?.response?.status === 404) {
      return {
        request_id: requestId,
        status: 'pending',
        success: false,
      };
    }
    throw error;
  }
}

// Helper function to poll for translation result
export async function pollTranslationResult(
  requestId: string,
  options?: {
    maxAttempts?: number;
    intervalMs?: number;
    timeoutMs?: number;
    useLlm?: boolean;
    useNovita?: boolean;
  }
): Promise<QueueTranslateResponse> {
  const maxAttempts = options?.maxAttempts || 60; // Default 60 attempts
  const intervalMs = options?.intervalMs || 1000; // Default 1 second
  const timeoutMs = options?.timeoutMs || 60000; // Default 60 seconds
  const useLlm = options?.useLlm || false;
  const useNovita = options?.useNovita || false;
  const startTime = Date.now();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error('Translation polling timeout');
    }

    try {
      let result: QueueTranslateResponse;
      if (useNovita) {
        result = await getQueueNovitaTranslateResult(requestId);
      } else if (useLlm) {
        result = await getQueueLlmTranslateResult(requestId);
      } else {
        result = await getQueueTranslateResult(requestId);
      }

      // If completed or failed, return immediately
      if (result.status === 'completed' || result.status === 'failed') {
        return result;
      }

      // If still pending or enqueued, wait and retry
      if (result.status === 'pending' || result.status === 'enqueued') {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        continue;
      }

      // Unknown status, return as is
      return result;
    } catch (error: any) {
      // Other errors, throw (404 is already handled in getQueueTranslateResult)
      throw error;
    }
  }

  throw new Error('Translation polling exceeded max attempts');
}


