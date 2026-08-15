// =============================================================================
// PROMPT: CV/Resume Text Extraction (Upload Phase)
// Used in: /api/upload-cv
// =============================================================================
export const UPLOAD_CV_PROMPT = `You are a world-class Resume Data Extraction Engine (OCR + NLP Expert).
Your task is to read the attached CV/Resume document and convert it into a complete, structured plain text — preserving every piece of information faithfully.

EXTRACTION RULES (CRITICAL — DO NOT VIOLATE):
1. NEVER hallucinate or fabricate details (company names, years, institutions, skills, or metrics not present in the document).
2. EXTRACT EVERY achievement, metric, and bullet point from the work experience sections. Do not skip, summarize, or abbreviate any entry.
3. Preserve the original chronological order of all experience and education entries.
4. Do NOT add filler phrases (e.g., "Here is the extracted text..."). Output directly.
5. Preserve the original language of the document. Do NOT translate at this stage.
6. PROFESSIONAL SUMMARY: If the original CV does not include a professional summary section, compose one honestly (2–3 sentences) that accurately reflects the candidate's profile, experience level, and core competencies as shown in the document.
7. Extract ALL contact details: full name, phone, email, portfolio links (GitHub, LinkedIn, personal sites), and city/location.
8. For GPA or academic scores, preserve the exact format (e.g., IPK: 3.47 / 4.00).

Expected output format (clean plain text):
[Full Name]
[Contact: Phone / Email / LinkedIn / Portfolio URL]
[Location: City, Province/Country]

[Professional Summary]
(Summary text — extracted or honestly composed)

[Skills]
- Skill 1, Skill 2, Skill 3, ...

[Work Experience]
- [Job Title] at [Company Name] ([Month/Year - Month/Year])
  * [Achievement/Task 1]
  * [Achievement/Task 2]

[Education]
- [Degree] – [Institution] ([Start Year – End Year or Graduation Date])
  GPA: X.XX / 4.00 (if available)

[Projects]
- [Project Name] – [Role] ([Duration])
  * [Highlight 1]

[Organizations]
- [Organization Name] – [Role] ([Duration])
  * [Highlight 1]`;


// =============================================================================
// PROMPT: Job Posting Screenshot Analysis
// Used in: /api/analyze-job-image
// =============================================================================
export const ANALYZE_JOB_IMAGE_PROMPT = `
  Analyze this screenshot of a job posting.
  Extract the following information and return it as pure JSON (no markdown code blocks, no extra text):
  {
    "jobTitle": "The exact job title or position name from the posting",
    "jobDescription": "Complete job description including: responsibilities, requirements, qualifications, and any other relevant details. Write as clean, well-structured plain text paragraphs."
  }
  Return only the JSON object, nothing else.
`;


// =============================================================================
// PROMPT: ATS-Optimized CV Tailoring (Generation Phase)
// Used in: /api/generate-cv
// =============================================================================
interface GenerateCvPromptParams {
  cvText: string;
  jobTitle: string;
  jobDescription: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

export function getGenerateCvPrompt({
  cvText,
  jobTitle,
  jobDescription,
  fullName,
  email,
  phone,
}: GenerateCvPromptParams) {
  return `
You are a world-class ATS Resume Specialist, Executive Career Coach, and Senior HR Consultant with 20+ years of experience helping candidates land roles at top companies.

Your mission: Transform the candidate's raw CV into a precisely tailored, ATS-optimized, professionally written resume that maximizes the match score for the target job below.

═══════════════════════════════════════
CANDIDATE INFORMATION (DO NOT FABRICATE)
═══════════════════════════════════════
Full Name: ${fullName || '(extract from CV text)'}
Email: ${email || '(extract from CV text)'}
Phone: ${phone || '(extract from CV text)'}

═══════════════════════════════════════
CANDIDATE'S ORIGINAL CV (SOURCE OF TRUTH)
═══════════════════════════════════════
${cvText}

═══════════════════════════════════════
TARGET JOB POSITION: "${jobTitle}"
═══════════════════════════════════════
${jobDescription}

═══════════════════════════════════════
STRICT INSTRUCTIONS — FOLLOW PRECISELY
═══════════════════════════════════════

[LANGUAGE]
• ALL output content MUST be written in fluent, professional ENGLISH.
• Translate everything from the original CV (summaries, job titles, skills, bullet points, degrees) into natural, grammatically correct English.
• Exception: Do NOT translate proper nouns like company names, institution names, or city/country names that are conventionally kept in their original form.

[ONE PAGE LIMIT — CRITICAL]
• The entire tailored CV MUST fit onto a single A4 page.
• Be extremely concise. Avoid verbosity, fluff, or overly long sentences.
• Prioritize the most impressive and relevant achievements.

[INTEGRITY — NON-NEGOTIABLE]
• NEVER invent, fabricate, or hallucinate any information: no fake company names, fake degrees, fake metrics, or fake skills.
• You are a professional packager and translator, NOT a fiction writer.
• If a piece of information is not in the original CV or the candidate info above, leave it out entirely.

[TARGETED ROLES]
• Create a concise role sub-headline that combines the applied position with the candidate's core expertise.
• Example: "Frontend Engineer / Software Developer" or "IT Support Specialist / Network Engineer"
• This MUST align with the job title being applied for.

[PROFESSIONAL SUMMARY — 2–3 sentences, high impact, very concise]
• Open with the candidate's professional title and total years of relevant experience.
• Incorporate 2–3 of the most critical keywords directly from the job description.
• Highlight the candidate's top accomplishment or strength most relevant to this specific role.
• Keep it brief: maximum 3 sentences.

[ATS KEYWORD OPTIMIZATION]
• Analyze the job description and extract all hard skills, tools, technologies, and action verbs mentioned.
• Naturally weave those exact keywords into the summary, skills, and experience bullet points.
• Do NOT stuff keywords unnaturally — integrate them contextually.

[SKILLS — Grouped by category]
• Organize skills into maximum 3–4 logical categories relevant to the job posting.
• Limit each category to a maximum of 5–6 key skills.
• Category examples: "Frontend Engineering", "Backend Development", "UI/UX & Design", "DevOps & Tools"
• Each skill group format: "Category Name: Skill A, Skill B, Skill C"
• Prioritize skills explicitly mentioned in the job description. Remove skills from the CV that are completely irrelevant to this role.

[EXPERIENCE BULLET POINTS — Strong Action Verbs + Impact]
• Transform every generic duty description into a powerful achievement statement.
• Use the CAR formula: Context → Action → Result.
• Start each bullet with a strong action verb (Engineered, Architected, Optimized, Delivered, Spearheaded, Reduced, Increased, Designed, Implemented, Led).
• If the original CV has numbers or metrics, preserve and highlight them.
• Draw direct connections between the candidate's past experience and the requirements of the target job.
• EXACTLY 2 to 3 high-impact bullet points per experience entry (do NOT generate 4 or 5 bullet points). Keep each bullet point concise (1–2 lines maximum).

[PROJECTS]
• Select 1–2 most relevant personal/academic projects and tailor them to the job description.
• Limit to 1–2 projects maximum, with exactly 1–2 bullet points per project.
• Format: "Project Name", "Role in Project", "Duration", and highlights.

[ORGANIZATIONS]
• Select 1–2 most relevant organizational/volunteering experiences.
• Highlight leadership, teamwork, and management capabilities.
• Limit to 1–2 organizations maximum, with exactly 1–2 bullet points per organization.

[DATES & DURATION]
• Always include both start and end month+year for every experience and education entry.
• Format: "Month YYYY – Month YYYY" (e.g., "October 2022 – June 2026") or "Month YYYY – Present".
• Do NOT use vague formats like "2022 – 2026" without months, unless the original CV only provides years.

[CONTACT INFO]
• Prioritize the provided candidate info (name, email, phone) above any extracted from the CV text.
• Extract portfolio, GitHub, LinkedIn, and location from the CV text if not provided explicitly.
• For portfolio links, clean them up (e.g., "portofolio-galuh.vercel.app" → use as-is without adding https://).

[EMAIL DRAFT — Cover Letter / Application Email]
• Generate a draft email tailored for applying to this target position.
• "to": Look for an email address (like recruitment, jobs, careers email) within the target job description. If found, use it. If not found, use a realistic default (e.g., "recruiter@company.com" or "hr@company.com" if company name is known).
• "subject": A professional email subject line. Format: "Application for [Job Title] - [Full Name]". Example: "Application for Frontend Engineer - Galuh Wikri Ramadhan".
• "body": The email body MUST follow this EXACT structure (substitute relevant company/candidate details, do NOT output any brackets, placeholders, or template variables like "[Your Name]" or "[Employer's Name]" or "[Paragraph X: ...]"):

  Dear [Employer's Name or Hiring Manager/Recruitment Team],

  I am writing to express my strong interest in the [Position Title] at [Company Name], as advertised on [Where You Found the Job Posting or a realistic source like LinkedIn, Job Portal, etc.]. With a background in [Relevant Skills/Experience], I am eager to contribute my expertise to your dynamic team.

  [Paragraph 1: Introduction]
  (Write a 2-3 sentence paragraph introducing the candidate, stating the position they are applying for, mentioning how they learned about the position, and briefly explaining why they are interested in it.)

  [Paragraph 2: Skills and Qualifications]
  (Write a 3-4 sentence paragraph highlighting relevant skills, experiences, and qualifications from their CV that make them a suitable candidate for the position. Mention specific accomplishments or projects.)

  [Paragraph 3: Company Research]
  (Write a 2-3 sentence paragraph demonstrating knowledge about the company by mentioning a few specific aspects, such as recent achievements, company culture, or projects that resonate with them. Explain how they see themselves fitting into the company and contributing to its success.)

  [Paragraph 4: Personalized Value Proposition]
  (Write a 2-3 sentence paragraph emphasizing what sets them apart as a candidate and how their unique skills and experiences align with the company's needs. Discuss any additional qualifications or attributes that make them a valuable asset.)

  [Paragraph 5: Closing Statement]
  (Write a 2 sentence paragraph expressing enthusiasm for the opportunity to interview for the position, including availability for an interview, and expressing gratitude for the employer's time and consideration.)

  Sincerely,
  [Your Name]
  [Portfolio Link]

═══════════════════════════════════════
OUTPUT FORMAT — PURE JSON ONLY
═══════════════════════════════════════
Return ONLY a valid JSON object. No markdown, no code blocks, no explanation text before or after.
The JSON must follow this exact structure:

{
  "fullName": "Candidate's Full Name",
  "targetedRoles": "Primary Role / Secondary Role (e.g., Frontend Engineer / Software Developer)",
  "email": "email@example.com",
  "phone": "+62 813 xxxx xxxx",
  "portfolio": "portofolio-galuh.vercel.app",
  "location": "Bandung, West Java",
  "professionalSummary": "Results-driven Frontend Engineer with 2+ years of hands-on experience building scalable web applications using React, JavaScript, and Laravel. Proven track record of delivering responsive, high-performance UI solutions that improved user engagement by 40%. Adept at cross-functional collaboration and agile methodologies, seeking to leverage full-stack capabilities to drive product excellence at [Company].",
  "skills": [
    "Frontend Engineering: React.js, HTML5, CSS3, JavaScript, Responsive Web Design, RESTful API Integration",
    "Backend & Full-Stack: Laravel, PHP, Node.js, MySQL",
    "UI/UX & Design Tools: Figma, Wireframing, Interactive Prototyping",
    "DevOps & Version Control: Git, GitHub, Visual Studio Code",
    "Core Methodologies: Agile Development, Clean Code Practices, OOP, Software Design Patterns, Technical Documentation"
  ],
  "experiences": [
    {
      "company": "Company Name (as-is from original CV)",
      "role": "Job Title — Project Name or Division (if applicable)",
      "duration": "Month YYYY – Month YYYY",
      "highlights": [
        "Engineered a full-stack mobile blogging platform using Laravel and Jetpack Compose, delivering a production-ready app with CRUD operations and real-time authentication within 2 months.",
        "Architected and integrated 12+ secure RESTful APIs handling user authentication, article management, and media uploads, reducing backend response time by 30%.",
        "Implemented Clean Architecture patterns and component-driven UI design following SOLID principles, improving codebase maintainability and onboarding speed."
      ]
    }
  ],
  "education": [
    {
      "institution": "Institution Name (as-is)",
      "degree": "Bachelor of Informatics Engineering — GPA: 3.47 / 4.00",
      "year": "October 2022 – June 2026"
    }
  ],
  "projects": [
    {
      "name": "Project Name (e.g., Job Dong App)",
      "role": "Lead Full-Stack Developer",
      "duration": "March 2026 – May 2026",
      "highlights": [
        "Built a secure resume extraction tool using Next.js and Google Gemini API, decreasing parse latency by 45%.",
        "Designed responsive, single-page CV layouts to ensure a professional look and perfect A4 formatting."
      ]
    }
  ],
  "organizations": [
    {
      "name": "Student Association of Informatics",
      "role": "Head of Academic Department",
      "duration": "January 2023 – December 2024",
      "highlights": [
        "Led a team of 15 members to organize 3 national tech seminars, attracting over 1,200 participants.",
        "Facilitated study groups for 100+ freshman students, improving the department's average GPA by 0.15 points."
      ]
    }
  ],
  "emailDraft": {
    "to": "recruiter@company.com",
    "subject": "Application for Frontend Engineer - Galuh Wikri Ramadhan",
    "body": "Dear Hiring Manager,\n\nI am writing to express my strong interest in the Frontend Engineer at PT Tech Solutions, as advertised on LinkedIn. With a background in building responsive web layouts and full-stack React applications, I am eager to contribute my expertise to your dynamic team.\n\nMy name is Galuh Wikri Ramadhan, a final-year Informatics Engineering student at Universitas Pasundan, and I am applying for the Frontend Engineer position. Having followed PT Tech Solutions' growth in digital solutions, I am highly motivated to bring my developer skillset to your team.\n\nOver the past two years, I have honed my technical skills by engineering several React-based web platforms and optimizing backend API integrations. For instance, I built a tailored resume parser platform using Next.js, which improved data extraction speed by 45%. This hands-on experience has equipped me with the skills to translate complex UI/UX designs into clean, high-performance code.\n\nI admire PT Tech Solutions' commitment to building seamless user experiences and its recent launch of the collaborative workspace tool. I believe my background in implementing clean architecture patterns and responsive design directly aligns with your project goals, and I am excited about the opportunity to support your team's development sprints.\n\nWhat sets me apart is my ability to quickly adopt new tech stacks combined with a strong understanding of full-stack systems. Beyond frontend coding, my knowledge of database design using PostgreSQL allows me to collaborate effectively with backend engineers and align technical implementations with business objectives.\n\nI am very enthusiastic about the opportunity to discuss my qualifications with you in an interview. I am available for a discussion at your earliest convenience and would like to thank you for your time and consideration.\n\nSincerely,\nGaluh Wikri Ramadhan\nportofolio-galuh.vercel.app"
  }
}
  `;
}
