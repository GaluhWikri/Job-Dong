import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'MOCK_API_KEY',
});

export const maxDuration = 60; // Set max duration for Vercel/Next.js edge functions

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const manualDescription = formData.get('description') as string | null;

    if (!file && !manualDescription) {
      return NextResponse.json({ error: 'Berikan gambar lowongan atau teks deskripsi.' }, { status: 400 });
    }

    let jobTitle = 'Posisi Tidak Diketahui';
    let jobDescription = manualDescription || '';

    if (file) {
      // In development mode without API key, we mock the response
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MOCK_API_KEY') {
        await new Promise(r => setTimeout(r, 2000));
        return NextResponse.json({
          success: true,
          jobTitle: "Software Engineer (Mock from Image)",
          jobDescription: "Dicari Software Engineer dengan pengalaman React dan Node.js minimal 2 tahun. Penempatan Jakarta Selatan. Mampu bekerja sama dalam tim dan menyelesaikan masalah secara mandiri."
        });
      }

      // Convert the uploaded File to a base64 string
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString('base64');
      const mimeType = file.type;

      const { ANALYZE_JOB_IMAGE_PROMPT } = await import('@/lib/ai-prompts');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ANALYZE_JOB_IMAGE_PROMPT,
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            }
          }
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });

      try {
        const extracted = JSON.parse(response.text || '{}');
        jobTitle = extracted.jobTitle || jobTitle;
        jobDescription = extracted.jobDescription || jobDescription;
      } catch (e) {
        console.error('Failed to parse Gemini response', e);
        jobDescription = response.text || '';
      }
    }

    return NextResponse.json({ 
      success: true, 
      jobTitle,
      jobDescription
    });

  } catch (error) {
    console.error('Error analyzing job image:', error);
    return NextResponse.json({ error: 'Gagal menganalisis gambar lowongan' }, { status: 500 });
  }
}
