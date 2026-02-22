// ─── Master Resume ────────────────────────────────────────────────────────────

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
  portfolio: string;
  summary: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

export interface SkillEntry {
  id: string;
  name: string;
}

export interface LanguageEntry {
  id: string;
  language: string;
  proficiency: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  url: string;
  bullets: string[];
}

export interface MasterResume {
  id: string;
  user_id: string;
  personal_info: PersonalInfo;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  languages: LanguageEntry[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
  created_at: string;
  updated_at: string;
}

// ─── Job Application ──────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'bookmarked'
  | 'applying'
  | 'applied'
  | 'interviewing'
  | 'negotiation'
  | 'accepted'
  | 'rejected';

export interface JobApplication {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  job_description: string | null;
  job_url: string | null;
  status: ApplicationStatus;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  salary_range: string | null;
  location: string | null;
  applied_date: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Resume Variant ───────────────────────────────────────────────────────────

export type TemplateId = 'classic' | 'modern' | 'minimal';

export type ResumeSection =
  | 'personal_info'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'projects';

export interface DesignSettings {
  font_family: string;
  font_size: number;
  line_height: number;
  list_line_height: number;
  accent_color: string;
  text_color: string;
  section_spacing: 'compact' | 'normal' | 'relaxed';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  font_family: 'Georgia',
  font_size: 10,
  line_height: 1.4,
  list_line_height: 1.2,
  accent_color: '#2E75B6',
  text_color: '#000000',
  section_spacing: 'normal',
  margins: { top: 40, bottom: 40, left: 40, right: 40 },
};

export interface ResumeVariant {
  id: string;
  job_application_id: string;
  user_id: string;
  template_id: TemplateId;
  personal_info: PersonalInfo;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  languages: LanguageEntry[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
  included_sections: ResumeSection[];
  design_settings: DesignSettings;
  section_order: ResumeSection[];
  created_at: string;
  updated_at: string;
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────

export type Priority = 'high' | 'medium' | 'low';

export interface MatchingStrength {
  area: string;
  detail: string;
}

export interface ImprovementArea {
  section: string;
  issue: string;
  suggestion: string;
  priority: Priority;
}

export interface RewriteSuggestion {
  id: string;
  section: string;
  original_index: number;
  bullet_index: number;
  original_text: string;
  suggested_text: string;
  keywords_addressed: string[];
  accepted: boolean;
}

// ─── Ideal Resume & ATS Scoring ──────────────────────────────────────────────

export interface KeywordEntry {
  keyword: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  frequency: number;
}

export interface KeywordMap {
  hard_skills: KeywordEntry[];
  soft_skills: KeywordEntry[];
  industry_terms: KeywordEntry[];
  qualifications: KeywordEntry[];
  action_verbs: KeywordEntry[];
}

export interface IdealStructure {
  section_order: string[];
  bullet_count_per_experience: number;
  has_summary: boolean;
  summary_length_range: [number, number];
  total_page_count: 1 | 2;
}

export interface IdealResume {
  summary: string;
  experience_bullets: string[];
  skills: string[];
  education: { degree: string; field: string }[];
  section_order: string[];
  keyword_map: KeywordMap;
  ideal_measurable_results_count: number;
  ideal_structure: IdealStructure;
}

// ─── ATS Suggestion Types ────────────────────────────────────────────────────

export type SuggestionType =
  | 'keyword_addition'
  | 'bullet_rewrite'
  | 'summary_rewrite'
  | 'section_reorder'
  | 'section_addition'
  | 'master_resume_content';

export type SuggestionCategory =
  | 'keyword'
  | 'measurable_result'
  | 'structure'
  | 'multiple';

export interface MetricImpacts {
  keyword: number;
  measurable_results: number;
  structure: number;
}

export interface ATSSuggestion {
  id: string;
  type: SuggestionType;
  category: SuggestionCategory;
  priority: Priority;
  estimated_score_impact: number;
  metric_impacts: MetricImpacts;
  original_text: string | null;
  suggested_text: string | null;
  target_section: string;
  target_index: number | null;
  bullet_index: number | null;
  keywords_addressed: string[];
  explanation: string;
}

// ─── Detailed Scores ─────────────────────────────────────────────────────────

export interface DetailedKeywordUsage {
  score: number;
  matched_keywords: {
    keyword: string;
    category: string;
    importance: string;
    found_in: string[];
  }[];
  missing_keywords: {
    keyword: string;
    category: string;
    importance: string;
    in_master_resume: boolean;
    estimated_impact: number;
  }[];
  synonym_matches: {
    expected: string;
    found: string;
    section: string;
  }[];
}

export interface DetailedMeasurableResults {
  score: number;
  total_bullets: number;
  bullets_with_metrics: number;
  ideal_count: number;
  bullet_assessments: {
    experience_index: number;
    bullet_index: number;
    has_metric: boolean;
    text: string;
  }[];
  summary_has_metric: boolean;
}

export interface DetailedStructure {
  score: number;
  section_order_score: number;
  current_order: string[];
  ideal_order: string[];
  completeness_score: number;
  missing_sections: string[];
  summary_score: number;
  summary_word_count: number;
  summary_ideal_range: [number, number];
  bullet_count_score: number;
  bullet_count_details: {
    company: string;
    current: number;
    ideal: number;
  }[];
  page_length_score: number;
  estimated_pages: number;
  ideal_pages: number;
}

export interface DetailedScores {
  keyword_usage: DetailedKeywordUsage;
  measurable_results: DetailedMeasurableResults;
  structure: DetailedStructure;
  composite: number;
  max_achievable: number;
}

// ─── Extended AI Analysis ────────────────────────────────────────────────────

export interface AiAnalysis {
  id: string;
  job_application_id: string;
  ats_score: number;
  summary: string;
  missing_keywords: string[];
  improvement_areas: ImprovementArea[];
  matching_strengths: MatchingStrength[];
  rewrite_suggestions: RewriteSuggestion[];
  raw_response: unknown;
  created_at: string;
  // V2 fields
  ideal_resume: IdealResume | null;
  keyword_score: number | null;
  measurable_results_score: number | null;
  structure_score: number | null;
  max_achievable_score: number | null;
  detailed_scores: DetailedScores | null;
  dismissed_suggestions: string[];
}

// ─── Client-Side Scoring ─────────────────────────────────────────────────────

export interface ClientScoreResult {
  keyword_score: number;
  measurable_results_score: number;
  structure_score: number;
  composite: number;
  max_achievable: number | null;
  is_estimate: true;
}
