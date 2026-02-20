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
}
