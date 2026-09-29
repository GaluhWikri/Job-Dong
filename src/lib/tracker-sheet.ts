import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Baca Google Spreadsheet "Job Application Tracker" milik user.
 * Server-only: memakai refresh token OAuth lokal (file yang sama dengan
 * script job_tracker_update.py), jadi tidak ada kredensial yang dikirim ke browser.
 */
export interface TrackerRow {
  date: string;
  position: string;
  company: string;
  via: string;
  status: string;
  updatedAt: string;
  note: string;
}

const SHEET_ID = process.env.TRACKER_SHEET_ID || '1I67vXeADIuboBD7VgHHUbMdEyCfjMq2n9deUg0PYT5U';
const RANGE = process.env.TRACKER_SHEET_RANGE || 'Lamaran!A1:H200';
const TOKEN_PATH =
  process.env.GOOGLE_TOKEN_PATH || path.join(os.homedir(), 'AppData', 'Local', 'hermes', 'google_token.json');

const TTL_MS = 60 * 1000; // spreadsheet jarang berubah, tapi jangan sampai basi lebih dari 1 menit
let cache: { at: number; rows: TrackerRow[] } | null = null;
let tokenCache: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.value;

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: token.client_id,
      client_secret: token.client_secret,
      refresh_token: token.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description || data.error || 'Gagal refresh token Google');

  // Token Google berlaku ~1 jam; simpan dengan margin 5 menit.
  tokenCache = { value: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000 - 5 * 60 * 1000 };
  return data.access_token;
}

export async function getTrackerRows({ fresh = false }: { fresh?: boolean } = {}): Promise<{ rows: TrackerRow[]; error?: string }> {
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return { rows: cache.rows };

  try {
    const accessToken = await getAccessToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(RANGE)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await res.json();
    if (!data.values) throw new Error(data.error?.message || 'Spreadsheet tidak mengembalikan data');

    const cell = (row: string[], i: number) => (row[i] ?? '').toString().trim();
    const rows: TrackerRow[] = (data.values as string[][])
      .slice(1)
      .filter((row) => row.some((c) => c && c.trim()))
      .map((row) => ({
        date: cell(row, 0),
        position: cell(row, 1),
        company: cell(row, 2),
        via: cell(row, 3),
        status: cell(row, 5) || 'Pending',
        updatedAt: cell(row, 6),
        note: cell(row, 7),
      }));

    cache = { at: Date.now(), rows };
    return { rows };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[tracker-sheet] gagal membaca spreadsheet:', message);
    return { rows: cache?.rows ?? [], error: message };
  }
}
