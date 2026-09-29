import { NextRequest, NextResponse } from 'next/server';
import { generateContent, hasAiKey, parseJsonLoose, responseText } from '@/lib/gemini';
import { getMatchScorePrompt, MATCH_SCORE_SCHEMA } from '@/lib/ai-prompts';

export const maxDuration = 60;
export const runtime = 'nodejs';

export interface MatchScoreResult {
  score: number;
  verdict: string;
  jobTitle: string;
  companyName: string;
  matched: string[];
  missing: string[];
  suggestions: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { cvText, jobDescription } = await request.json();

    if (!cvText?.trim() || !jobDescription?.trim()) {
      return NextResponse.json(
        { error: 'Teks CV dan deskripsi lowongan wajib diisi.' },
        { status: 400 }
      );
    }

    if (!hasAiKey()) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum di-set, fitur skor kecocokan tidak tersedia.' },
        { status: 503 }
      );
    }

    const response = await generateContent({
      contents: getMatchScorePrompt({ cvText, jobDescription }),
      config: {
        responseMimeType: 'application/json',
        responseSchema: MATCH_SCORE_SCHEMA,
        temperature: 0.2,
      },
    });

    const rawText = responseText(response);
    let match: MatchScoreResult;
    try {
      match = parseJsonLoose<MatchScoreResult>(rawText);
    } catch (parseError) {
      console.error('[match-score] JSON parse error. Raw:', rawText.slice(0, 500));
      return NextResponse.json(
        { error: `AI mengembalikan format yang tidak valid (${String(parseError)}). Coba lagi.` },
        { status: 502 }
      );
    }

    match.score = Math.max(0, Math.min(100, Math.round(Number(match.score) || 0)));

    return NextResponse.json({ success: true, match });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[match-score] Unhandled error:', errMsg);
    const busy = /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED|overloaded/i.test(errMsg);
    return NextResponse.json(
      {
        error: busy
          ? 'Server AI sedang sibuk (high demand). Tunggu beberapa detik lalu klik "Nilai Kecocokan" sekali lagi.'
          : `Gagal menilai kecocokan: ${errMsg}`,
      },
      { status: busy ? 503 : 500 }
    );
  }
}
