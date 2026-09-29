import { NextRequest, NextResponse } from 'next/server';
import { extractCvTextLocal, detectCvSource, MAX_CV_BYTES } from '@/lib/cv-file';
import { generateContent, hasAiKey, responseText } from '@/lib/gemini';
import { UPLOAD_CV_PROMPT } from '@/lib/ai-prompts';

export const maxDuration = 60;
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Tidak ada file CV yang dikirim.' }, { status: 400 });
    }
    if (file.size > MAX_CV_BYTES) {
      return NextResponse.json(
        { error: `Ukuran file terlalu besar (maks ${MAX_CV_BYTES / 1024 / 1024}MB).` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const source = detectCvSource(file.type, file.name);

    if (source === 'unsupported') {
      return NextResponse.json(
        { error: 'Format tidak didukung. Gunakan PDF, DOCX, atau TXT (format .doc lama harap disimpan ulang sebagai PDF/DOCX).' },
        { status: 415 }
      );
    }

    // 1) Format berbasis teks -> ekstraksi lokal (cepat, akurat, tanpa kuota AI).
    if (source !== 'image') {
      const localText = await extractCvTextLocal(buffer, source);
      if (localText) {
        return NextResponse.json({
          success: true,
          text: localText,
          source: source === 'docx' ? 'local-docx' : 'local-pdf',
          message: 'CV berhasil diekstrak',
        });
      }
    }

    // 2) Gambar CV atau PDF hasil scan -> teksnya ada di dalam gambar, butuh AI vision.
    if (!hasAiKey()) {
      return NextResponse.json(
        {
          error:
            source === 'image'
              ? 'Upload CV berformat gambar membutuhkan GEMINI_API_KEY. Silakan tempel teks CV secara manual atau unggah PDF/DOCX.'
              : 'File ini tidak punya lapisan teks (hasil scan/foto) dan GEMINI_API_KEY belum di-set. Silakan tempel teks CV secara manual.',
        },
        { status: 422 }
      );
    }

    const mime = file.type || (source === 'image' ? 'image/png' : 'application/pdf');
    const response = await generateContent({
      contents: [
        { role: 'user', parts: [{ text: UPLOAD_CV_PROMPT }, { inlineData: { mimeType: mime, data: buffer.toString('base64') } }] },
      ],
    });

    const text = responseText(response).trim();
    if (!text) {
      return NextResponse.json(
        { error: 'AI tidak menghasilkan teks dari CV tersebut. Coba file lain atau tempel manual.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      text,
      source: 'gemini-vision',
      message: 'CV berhasil diparse oleh AI',
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[upload-cv] error:', errMsg);
    if (/password|encrypted/i.test(errMsg)) {
      return NextResponse.json({ error: 'File CV terkunci dengan password sehingga tidak bisa dibaca.' }, { status: 422 });
    }
    return NextResponse.json({ error: `Gagal memproses CV: ${errMsg}` }, { status: 500 });
  }
}
