// All prompts are always in English, regardless of user locale.
// AI works in English for ATS optimization purposes.

export const RESUME_PARSE_PROMPT = `You are a resume parser. Extract structured data from the following resume text.
Return ONLY valid JSON matching this exact schema:
{
  "personal_info": {
    "fullName": "", "email": "", "phone": "", "location": "",
    "linkedIn": "", "portfolio": "", "summary": ""
  },
  "experience": [
    {
      "id": "<uuid>", "company": "", "title": "", "startDate": "",
      "endDate": "", "current": false, "location": "", "bullets": []
    }
  ],
  "education": [
    {
      "id": "<uuid>", "institution": "", "degree": "", "field": "",
      "startDate": "", "endDate": "", "gpa": ""
    }
  ],
  "skills": [
    { "id": "<uuid>", "name": "" }
  ],
  "languages": [
    { "id": "<uuid>", "language": "", "proficiency": "" }
  ],
  "certifications": [
    { "id": "<uuid>", "name": "", "issuer": "", "date": "", "url": "" }
  ],
  "projects": [
    {
      "id": "<uuid>", "name": "", "description": "", "url": "", "bullets": []
    }
  ]
}

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
