import { NextRequest, NextResponse } from 'next/server';
import { generateContent, hasAiKey, parseJsonLoose, responseText } from '@/lib/gemini';
import { ANALYZE_JOB_IMAGE_PROMPT, JOB_POSTING_SCHEMA } from '@/lib/ai-prompts';

export const maxDuration = 60;
export const runtime = 'nodejs';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const manualDescription = (formData.get('description') as string | null) || '';

    if (!file && !manualDescription) {
      return NextResponse.json({ error: 'Berikan gambar lowongan atau teks deskripsi.' }, { status: 400 });
    }
    if (file && file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Ukuran gambar terlalu besar (maks 10MB).' }, { status: 413 });
    }

    // Tanpa gambar, teks manual dipakai apa adanya — tidak perlu AI.
    if (!file) {
      return NextResponse.json({ success: true, jobTitle: '', companyName: '', applicationEmail: '', jobDescription: manualDescription });
    }

    if (!hasAiKey()) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum di-set, analisis gambar lowongan tidak tersedia. Tempel teks lowongan secara manual.' },
        { status: 503 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const response = await generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: ANALYZE_JOB_IMAGE_PROMPT },
            { inlineData: { mimeType: file.type || 'image/png', data: buffer.toString('base64') } },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: JOB_POSTING_SCHEMA,
      },
    });

    const raw = responseText(response);
    try {
      const extracted = parseJsonLoose<Record<string, string>>(raw);
      return NextResponse.json({
        success: true,
        jobTitle: extracted.jobTitle || '',
        companyName: extracted.companyName || '',
        applicationEmail: extracted.applicationEmail || '',
        jobDescription: extracted.jobDescription || '',
      });
    } catch {
      // Model gagal mengikuti skema: pakai teks mentah sebagai deskripsi, jangan gagalkan seluruh alur.
      console.error('[analyze-job-image] JSON parse gagal, fallback ke teks mentah');
      return NextResponse.json({ success: true, jobTitle: '', companyName: '', applicationEmail: '', jobDescription: raw });
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[analyze-job-image] error:', errMsg);
    const busy = /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED|overloaded/i.test(errMsg);
    return NextResponse.json(
      { error: busy ? 'Server AI sedang sibuk, coba lagi sebentar lagi.' : 'Gagal menganalisis gambar lowongan.' },
      { status: busy ? 503 : 500 }
    );
  }
}
