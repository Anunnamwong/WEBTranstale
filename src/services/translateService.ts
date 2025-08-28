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


