import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'MOCK_API_KEY',
});

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const mimeType = file.type || 'application/pdf';

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MOCK_API_KEY') {
       return NextResponse.json({ 
         success: true, 
         text: "Nama: John Doe\nSkill: React, Next.js\n\n(Catatan: Ini teks mock karena GEMINI_API_KEY belum di-set.)" 
       });
    }

    const { UPLOAD_CV_PROMPT } = await import('@/lib/ai-prompts');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        UPLOAD_CV_PROMPT,
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          }
        }
      ]
    });

    return NextResponse.json({ 
      success: true, 
      text: response.text,
      message: 'CV berhasil diparse oleh AI'
    });

  } catch (error: any) {
    console.error('Error parsing CV:', error);
    return NextResponse.json({ error: error.message || 'Failed to process CV' }, { status: 500 });
  }
}
