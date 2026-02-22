// All prompts are always in English, regardless of user locale.
// AI works in English for ATS optimization purposes.

export const RESUME_PARSE_PROMPT = `You are a resume parser. Extract structured data from the following resume text.
Return ONLY valid JSON matching this exact schema:
{
  "personal_info": {
    "fullName": "string",
    "email": "string",
    "phone": "string (clean format, e.g. +1 234 567 8900)",
    "location": "string (city, country)",
    "linkedIn": "string (full URL or empty string)",
    "portfolio": "string (full URL or empty string)",
    "summary": "string (professional summary/objective, clean prose without bullet markers)"
  },
  "experience": [
    {
      "id": "uuid",
      "company": "string (company name only, no extra text)",
      "title": "string (job title only)",
      "startDate": "string (YYYY-MM format, e.g. 2022-01)",
      "endDate": "string (YYYY-MM format or empty if current)",
      "current": "boolean (true if this is the current role)",
      "location": "string",
      "bullets": ["string (clean bullet point text without leading dashes, dots, or markers)"]
    }
  ],
  "education": [
    {
      "id": "uuid",
      "institution": "string",
      "degree": "string (e.g. Bachelor's, Master's, PhD)",
      "field": "string (field of study)",
      "startDate": "string (YYYY-MM format)",
      "endDate": "string (YYYY-MM format)",
      "gpa": "string (if mentioned, otherwise empty)"
    }
  ],
  "skills": [
    { "id": "uuid", "name": "string (one skill per entry, no grouping)" }
  ],
  "languages": [
    { "id": "uuid", "language": "string", "proficiency": "string (e.g. Native, Fluent, Intermediate, Basic)" }
  ],
  "certifications": [
    { "id": "uuid", "name": "string", "issuer": "string", "date": "string (YYYY-MM format)", "url": "string" }
  ],
  "projects": [
    {
      "id": "uuid",
      "name": "string",
      "description": "string (brief description, clean prose)",
      "url": "string",
      "bullets": ["string (clean bullet text without leading markers)"]
    }
  ]
}

Rules:
- Generate unique UUIDs for each id field
- Use YYYY-MM format for all dates (e.g. 2022-01). If only a year is given, use YYYY-01
- Remove all leading bullet markers (-, *, •, >, etc.) from bullet point text
- Trim whitespace, remove redundant special characters
- Each skill should be a separate entry (split comma-separated skill lists)
- If a field cannot be determined, use an empty string (not null)
- Order experience and education by date, most recent first

Resume text:
{{resume_text}}`;

export const AI_ANALYSIS_PROMPT = `You are an expert ATS (Applicant Tracking System) analyst and career coach.

Analyze the following resume against the job description. Return ONLY valid JSON matching this schema:

{
  "ats_score": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "missing_keywords": ["keyword1", "keyword2"],
  "matching_strengths": [{ "area": "<area>", "detail": "<why this is strong>" }],
  "improvement_areas": [
    {
      "section": "<experience|skills|education|summary>",
      "issue": "<what's wrong>",
      "suggestion": "<how to fix>",
      "priority": "<high|medium|low>"
    }
  ],
  "rewrite_suggestions": [
    {
      "id": "<uuid>",
      "section": "experience",
      "original_index": <index in experience array>,
      "bullet_index": <index of bullet in that experience entry>,
      "original_text": "<the current bullet point>",
      "suggested_text": "<rewritten version optimized for this job>",
      "keywords_addressed": ["keyword1", "keyword2"]
    }
  ]
}

JOB DESCRIPTION:
{{job_description}}

RESUME:
{{resume_json}}`;

export const JOB_URL_PARSE_PROMPT = `You are a job posting parser. Extract structured data from the following job posting text.
Return ONLY valid JSON matching this exact schema:
{
  "job_title": "string",
  "company": "string",
  "location": "string or null",
  "salary_range": "string or null",
  "job_description": "string (the full job description, preserve structure using newlines for paragraphs and '- ' prefix for bullet points)"
}

If a field cannot be determined, set it to null.

Job posting text:
{{extracted_text}}`;
