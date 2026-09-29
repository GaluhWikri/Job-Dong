import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || 'MOCK_API_KEY' });

/** Model tunggal untuk semua fitur AI — override lewat env GEMINI_MODEL kalau perlu. */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export const hasAiKey = () => Boolean(apiKey) && apiKey !== 'MOCK_API_KEY';

const RETRYABLE = /429|500|503|UNAVAILABLE|RESOURCE_EXHAUSTED|INTERNAL|overloaded|deadline|fetch failed|ECONNRESET/i;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * generateContent dengan retry+backoff. Gemini rutin balas 503 "high demand" /
 * 500 INTERNAL secara acak — tanpa retry, satu kali apes = fitur gagal total.
 */
export async function generateContent(
  params: Omit<Parameters<typeof ai.models.generateContent>[0], 'model'>,
  retries = 3
) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent({ model: GEMINI_MODEL, ...params });
    } catch (error) {
      lastError = error;
      const msg = error instanceof Error ? error.message : String(error);
      if (attempt === retries || !RETRYABLE.test(msg)) throw error;
      console.warn(`[gemini] attempt ${attempt + 1} failed (${msg.slice(0, 120)}), retrying...`);
      await sleep(1500 * 2 ** attempt);
    }
  }
  throw lastError;
}

/** Ambil teks gabungan dari response (semua part). */
export function responseText(response: { text?: string; candidates?: unknown }): string {
  return (response as { text?: string }).text || '';
}

/** Bersihkan output JSON dari pagar markdown / teks pembungkus. */
export function parseJsonLoose<T>(raw: string): T {
  let text = (raw || '').trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) text = text.substring(start, end + 1);
  return JSON.parse(text) as T;
}
