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

export const IDEAL_RESUME_PROMPT = `You are an expert ATS (Applicant Tracking System) analyst and professional resume writer.

Given the following job description, construct the IDEAL resume that would score a perfect 100/100 on any ATS system for this role. This ideal resume should represent a perfectly qualified candidate.

Return ONLY valid JSON matching this schema:

{
  "summary": "<ideal professional summary, 2-4 sentences>",
  "experience_bullets": [
    "<ideal bullet point with measurable result>",
    "..."
  ],
  "skills": ["<every relevant skill/keyword>", "..."],
  "education": [
    { "degree": "<ideal degree>", "field": "<ideal field>" }
  ],
  "section_order": ["experience", "skills", "education", "certifications", "projects", "languages"],
  "keyword_map": {
    "hard_skills": [
      { "keyword": "<skill>", "importance": "critical|important|nice_to_have", "frequency": <times mentioned in JD> }
    ],
    "soft_skills": [
      { "keyword": "<skill>", "importance": "critical|important|nice_to_have", "frequency": <number> }
    ],
    "industry_terms": [
      { "keyword": "<term>", "importance": "critical|important|nice_to_have", "frequency": <number> }
    ],
    "qualifications": [
      { "keyword": "<qualification>", "importance": "critical|important|nice_to_have", "frequency": <number> }
    ],
    "action_verbs": [
      { "keyword": "<verb>", "importance": "critical|important|nice_to_have", "frequency": <number> }
    ]
  },
  "ideal_measurable_results_count": <number of quantified achievements expected>,
  "ideal_structure": {
    "section_order": ["<optimal section ordering>"],
    "bullet_count_per_experience": <ideal number>,
    "has_summary": true,
    "summary_length_range": [<min_words>, <max_words>],
    "total_page_count": <1 or 2 based on seniority>
  }
}

Rules:
- Extract EVERY keyword, technology, tool, methodology, and qualification from the JD
- Classify each keyword by importance: "critical" (explicitly required), "important" (mentioned as preferred), "nice_to_have" (implied or related)
- Experience bullets must all contain measurable results (numbers, percentages, dollar amounts)
- Section order should reflect what ATS systems and hiring managers for this role type expect to see first
- The ideal bullet count should reflect the seniority level (entry: 2-3, mid: 3-4, senior: 4-6 per role)

JOB DESCRIPTION:
{{job_description}}`;

export const AI_ANALYSIS_V2_PROMPT = `You are an expert ATS (Applicant Tracking System) analyst and career coach.

You have been given:
1. A job description
2. The user's current resume (the resume variant they are using for this application)
3. The user's master resume (their complete career data)
4. The ideal resume benchmark for this job (previously generated)

Analyze the current resume against the ideal resume benchmark and return ONLY valid JSON:

{
  "scores": {
    "keyword_usage": {
      "score": <0-100>,
      "matched_keywords": [
        { "keyword": "string", "category": "hard_skills|soft_skills|industry_terms|qualifications|action_verbs", "importance": "critical|important|nice_to_have", "found_in": ["skills", "experience"] }
      ],
      "missing_keywords": [
        { "keyword": "string", "category": "string", "importance": "string", "in_master_resume": true, "estimated_impact": <number> }
      ],
      "synonym_matches": [
        { "expected": "string", "found": "string", "section": "string" }
      ]
    },
    "measurable_results": {
      "score": <0-100>,
      "total_bullets": <number>,
      "bullets_with_metrics": <number>,
      "ideal_count": <number>,
      "bullet_assessments": [
        { "experience_index": <number>, "bullet_index": <number>, "has_metric": true, "text": "string" }
      ],
      "summary_has_metric": true
    },
    "structure": {
      "score": <0-100>,
      "section_order_score": <0-100>,
      "current_order": ["string"],
      "ideal_order": ["string"],
      "completeness_score": <0-100>,
      "missing_sections": ["string"],
      "summary_score": <0-100>,
      "summary_word_count": <number>,
      "summary_ideal_range": [<min>, <max>],
      "bullet_count_score": <0-100>,
      "bullet_count_details": [
        { "company": "string", "current": <number>, "ideal": <number> }
      ],
      "page_length_score": <0-100>,
      "estimated_pages": <number>,
      "ideal_pages": <number>
    },
    "composite": <0-100>,
    "max_achievable": <0-100>
  },
  "summary": "<2-3 sentence overall assessment>",
  "matching_strengths": [{ "area": "string", "detail": "string" }],
  "missing_keywords": ["string"],
  "suggestions": [
    {
      "id": "<uuid>",
      "type": "keyword_addition|bullet_rewrite|summary_rewrite|section_reorder|section_addition|master_resume_content",
      "category": "keyword|measurable_result|structure|multiple",
      "priority": "high|medium|low",
      "estimated_score_impact": <number>,
      "metric_impacts": { "keyword": <number>, "measurable_results": <number>, "structure": <number> },
      "original_text": "<current text, if applicable, or null>",
      "suggested_text": "<proposed text, if applicable, or null>",
      "target_section": "<section name>",
      "target_index": <index or null>,
      "bullet_index": <index or null>,
      "keywords_addressed": ["string"],
      "explanation": "<why this helps>"
    }
  ]
}

Scoring weights: Keywords 40%, Measurable Results 40%, Structure 20%.

Rules for suggestions:
- Generate suggestions ONLY where there is room to improve the score
- Each suggestion must have a realistic estimated_score_impact (how much the COMPOSITE score would increase)
- Sort suggestions by estimated_score_impact descending (highest impact first)
- For bullet rewrites: the suggested text must sound natural, professional, and specific to this industry
- For keyword additions: suggest WHERE to naturally incorporate the keyword, don't just list it
- For master resume content: reference specific items from the master resume that are relevant
- Never suggest adding skills or experience the user doesn't actually have (only what's in the master resume)
- Limit to a maximum of 15 suggestions, focusing on highest-impact items
- max_achievable should be calculated assuming the user applies all possible improvements from their master resume

JOB DESCRIPTION:
{{job_description}}

CURRENT RESUME VARIANT:
{{resume_variant_json}}

MASTER RESUME:
{{master_resume_json}}

IDEAL RESUME BENCHMARK:
{{ideal_resume_json}}`;
