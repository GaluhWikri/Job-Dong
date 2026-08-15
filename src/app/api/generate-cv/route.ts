import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'MOCK_API_KEY',
});

/**
 * Attempts to robustly parse the raw AI response text into a JSON object.
 * Handles cases where the model wraps JSON in markdown code blocks or adds extra text.
 */
function parseJsonResponse(raw: string): Record<string, unknown> {
  let text = (raw || '').trim();

  // Strip markdown code fences like ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Find the first { and last } to extract JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    text = text.substring(start, end + 1);
  }

  return JSON.parse(text);
}

export async function POST(request: NextRequest) {
  try {
    const { cvText, jobDescription, jobTitle, fullName, email, phone } = await request.json();

    if (!cvText || !jobDescription) {
      return NextResponse.json({ error: 'Missing cvText or jobDescription' }, { status: 400 });
    }

    const { getGenerateCvPrompt } = await import('@/lib/ai-prompts');
    const prompt = getGenerateCvPrompt({ cvText, jobDescription, jobTitle, fullName, email, phone });

    // In development mode without API key, we mock the response
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MOCK_API_KEY') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        // Remove responseMimeType constraint so model has more freedom to output
        // and we handle the parsing ourselves robustly below
      });

      const rawText = response.text || '';
      console.log('[generate-cv] Raw AI response length:', rawText.length);
      console.log('[generate-cv] Raw AI response preview:', rawText.substring(0, 300));

      let tailoredCvData: Record<string, unknown>;
      try {
        tailoredCvData = parseJsonResponse(rawText);
      } catch (parseError) {
        console.error('[generate-cv] JSON parse error. Raw response:', rawText);
        return NextResponse.json(
          { error: `AI response was not valid JSON. Parse error: ${String(parseError)}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, tailoredCv: tailoredCvData });
    } else {
      // Mock Response for development without API key
      await new Promise(r => setTimeout(r, 2000));
      return NextResponse.json({ 
        success: true, 
        tailoredCv: {
          fullName: fullName || "John Doe",
          targetedRoles: jobTitle + " / Software Developer",
          email: email || "johndoe@email.com",
          phone: phone || "+62 812 3456 7890",
          portfolio: "portofolio-candidate.vercel.app",
          location: "Bandung, West Java",
          professionalSummary: "Results-driven " + jobTitle + " with proven expertise in delivering high-quality software solutions. Seeking to leverage technical skills and collaborative approach to drive product excellence.",
          skills: [
            "Frontend Engineering: React.js, HTML5, CSS3, JavaScript",
            "Software Development: Laravel, OOP, Clean Architecture",
            "UI/UX & Integration: Figma, Wireframing, Prototyping",
            "Core Methodologies: Agile Development, Clean Code, Technical Documentation"
          ],
          experiences: [
            {
              company: "Previous Company",
              role: "Software Developer",
              duration: "January 2023 – Present",
              highlights: [
                "Engineered a scalable web application using React.js and Laravel, improving system performance by 35%.",
                "Designed and implemented 10+ RESTful APIs for real-time data processing and user authentication.",
                "Collaborated with cross-functional teams to deliver product features on time within agile sprints."
              ]
            }
          ],
          education: [
            {
              institution: "Universitas Pasundan",
              degree: "Bachelor of Informatics Engineering — GPA: 3.47 / 4.00",
              year: "October 2022 – June 2026"
            }
          ],
          projects: [
            {
              name: "Job Dong Platform",
              role: "Lead Developer",
              duration: "March 2026 – Present",
              highlights: [
                "Built an automated ATS resume generator leveraging Google Gemini API and Next.js, boosting user signups.",
                "Optimized Tailwind layouts and spacing to guarantee single-page outputs for standard A4 formats."
              ]
            }
          ],
          organizations: [
            {
              name: "Informatics Student Union",
              role: "Head of Tech Division",
              duration: "January 2024 – December 2025",
              highlights: [
                "Led a team of 10 to develop a department website, improving communication for 500+ students.",
                "Organized a campus-wide hackathon with 150+ participants and secured IDR 20M in corporate sponsorships."
              ]
            }
          ],
          emailDraft: {
            to: "hr@company.com",
            subject: `Application for ${jobTitle || "Software Developer"} - ${fullName || "John Doe"}`,
            body: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${jobTitle || "Software Developer"} at PT Company Name, as advertised on LinkedIn. With a background in database systems and full-stack software architecture, I am eager to contribute my expertise to your dynamic team.\n\nMy name is ${fullName || "John Doe"}, a final-year Informatics Engineering student at Universitas Pasundan, and I am applying for the ${jobTitle || "Software Developer"} position. Having followed your company's growth in digital solutions, I am highly motivated to bring my developer skillset to your team.\n\nOver the past years, I have honed my technical skills by building full-stack platforms and optimizing data queries. For instance, I built an automated resume parser leveraging Next.js and Google Gemini API, which improved data extraction speed by 45%. This hands-on experience has equipped me with the skills to design scalable and user-friendly web solutions.\n\nI admire PT Company Name's dedication to building seamless user experiences and its recent launch of collaborative workspace tools. I believe my background in clean code practices and responsive design directly aligns with your project goals, and I am excited about the opportunity to support your team's development sprints.\n\nWhat sets me apart is my ability to quickly adopt new tech stacks combined with a strong understanding of database design. My knowledge of database systems and RESTful APIs allows me to collaborate effectively with backend developers and align technical implementations with business objectives.\n\nI am very enthusiastic about the opportunity to discuss my qualifications with you in an interview. I am available for a discussion at your earliest convenience and would like to thank you for your time and consideration.\n\nSincerely,\n${fullName || "John Doe"}\nportofolio-candidate.vercel.app`
          }
        }
      });
    }

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[generate-cv] Unhandled error:', errMsg);
    return NextResponse.json({ error: `Failed to generate CV: ${errMsg}` }, { status: 500 });
  }
}
