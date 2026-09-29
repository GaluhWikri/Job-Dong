import { NextRequest, NextResponse } from 'next/server';
import { generateContent, hasAiKey, parseJsonLoose, responseText } from '@/lib/gemini';
import { getGenerateCvPrompt, TAILORED_CV_SCHEMA } from '@/lib/ai-prompts';

export const maxDuration = 60;
export const runtime = 'nodejs';

// Model kadang mengembalikan body email sebagai satu baris panjang. Rapikan jadi
// paragraf: salam → isi (3 kalimat/paragraf) → penutup.
function formatEmailBody(raw: string): string {
  const body = (raw || '').trim();
  if (!body || body.includes('\n')) return body;

  const signOff = body.match(/\s*((?:Sincerely|Best regards|Kind regards|Regards|Hormat saya|Salam)[,.]?\s*[^.]*)$/i);
  const main = signOff ? body.slice(0, signOff.index).trim() : body;
  const sentences = main.split(/(?<=[.!?])\s+/);
  const paragraphs: string[] = [];
  if (/^Dear/i.test(sentences[0] ?? '')) paragraphs.push(sentences.shift()!);
  while (sentences.length > 3) paragraphs.push(sentences.splice(0, 3).join(' '));
  if (sentences.length) paragraphs.push(sentences.join(' '));
  if (signOff) paragraphs.push(signOff[1].trim());

  return paragraphs.join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const { cvText, jobDescription, jobTitle, companyName, applicationEmail, fullName, email, phone } = await request.json();

    if (!cvText?.trim() || !jobDescription?.trim()) {
      return NextResponse.json(
        { error: 'Teks CV dan Kualifikasi/Deskripsi Pekerjaan wajib diisi.' },
        { status: 400 }
      );
    }

    if (!hasAiKey()) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY belum di-set, fitur AI tailoring tidak tersedia.' },
        { status: 503 }
      );
    }

    const prompt = getGenerateCvPrompt({
      cvText,
      jobDescription,
      jobTitle: jobTitle || 'Posisi Pekerjaan',
      companyName,
      applicationEmail,
      fullName,
      email,
      phone,
    });

    const response = await generateContent({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: TAILORED_CV_SCHEMA,
        temperature: 0.4,
      },
    });

    const rawText = responseText(response);
    const finishReason = (response as { candidates?: { finishReason?: string }[] }).candidates?.[0]?.finishReason;
    console.log('[generate-cv] chars:', rawText.length, 'finishReason:', finishReason);

    let tailoredCv: Record<string, unknown>;
    try {
      tailoredCv = parseJsonLoose(rawText);
    } catch (parseError) {
      console.error('[generate-cv] JSON parse error. Raw:', rawText.slice(0, 500));
      return NextResponse.json(
        { error: `AI mengembalikan format yang tidak valid (${String(parseError)}). Silakan coba generate ulang.` },
        { status: 502 }
      );
    }

    const draft = tailoredCv.emailDraft as { body?: string } | undefined;
    if (draft?.body) draft.body = formatEmailBody(draft.body);

    return NextResponse.json({ success: true, tailoredCv });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[generate-cv] Unhandled error:', errMsg);
    const busy = /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED|overloaded/i.test(errMsg);
    return NextResponse.json(
      {
        error: busy
          ? 'Server AI sedang sibuk (high demand). Tunggu beberapa detik lalu klik "Sesuaikan CV" sekali lagi.'
          : `Gagal membuat CV: ${errMsg}`,
      },
      { status: busy ? 503 : 500 }
    );
  }
}
