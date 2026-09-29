import zlib from 'node:zlib';

export const MAX_CV_BYTES = 15 * 1024 * 1024; // batas aman utk inline upload + parse lokal

export type CvSource = 'pdf' | 'docx' | 'text' | 'image' | 'unsupported';

/** Tentukan jenis file dari mime type, fallback ke ekstensi (browser sering kirim mime kosong). */
export function detectCvSource(mime: string, filename: string): CvSource {
  const name = (filename || '').toLowerCase();
  const type = (mime || '').toLowerCase();
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    type.includes('officedocument.wordprocessingml') ||
    type === 'application/msword' ||
    name.endsWith('.docx') ||
    name.endsWith('.doc')
  ) {
    return name.endsWith('.doc') ? 'unsupported' : 'docx';
  }
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('text/') || /\.(txt|md|csv)$/.test(name)) return 'text';
  return 'unsupported';
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ',
};
const decodeEntities = (s: string) =>
  s.replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (m) => ENTITIES[m]).replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

/** Ambil satu entry dari zip buffer (parsing central directory). DOCX = zip berisi XML. */
function readZipEntry(buf: Buffer, entryName: string): Buffer | null {
  let eocd = -1;
  const minStart = Math.max(0, buf.length - 66000);
  for (let i = buf.length - 22; i >= minStart; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) return null;

  const total = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < total; n++) {
    if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) return null;
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);

    if (name === entryName) {
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(start, start + compSize);
      return method === 0 ? data : zlib.inflateRawSync(data);
    }
    off += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

/** DOCX/XLSX OpenXML -> teks polos, tanpa dependency tambahan. */
export function docxToText(buf: Buffer): string {
  const xml = readZipEntry(buf, 'word/document.xml');
  if (!xml) return '';
  return decodeEntities(
    xml
      .toString('utf8')
      .replace(/<w:tab\b[^>]*\/>/g, '\t')
      .replace(/<w:br\b[^>]*\/>|<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** PDF -> teks via pdf-parse (lokal, instan). Kosong = PDF hasil scan/gambar. */
export async function pdfToText(buf: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buf) });
  try {
    const result = await parser.getText();
    return (result.text || '').trim();
  } finally {
    await parser.destroy().catch(() => {});
  }
}

/**
 * Ekstraksi teks CV tanpa AI untuk format teks-based (PDF/DOCX/TXT).
 * Return null kalau tidak ada teks yang bisa diambil (mis. PDF scan) — pemanggil
 * yang memutuskan mau fallback ke Gemini vision atau balas error.
 */
export async function extractCvTextLocal(
  buf: Buffer,
  source: CvSource
): Promise<string | null> {
  if (source === 'docx') {
    const text = docxToText(buf);
    return text.length > 30 ? text : null;
  }
  if (source === 'pdf') {
    const text = await pdfToText(buf);
    // PDF 1 halaman yang benar-benar berisi teks jauh di atas ambang ini;
    // di bawah ini hampir pasti hasil scan tanpa text layer.
    return text.replace(/\s/g, '').length > 120 ? text : null;
  }
  if (source === 'text') return buf.toString('utf8').trim() || null;
  return null;
}
