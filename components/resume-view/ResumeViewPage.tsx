'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Download, Save, FileText, ExternalLink, MapPin, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { PreviewTab } from './PreviewTab';
import { DesignTab } from './DesignTab';
import { JobMatchingTab } from './JobMatchingTab';
import { V1JobMatchingTab } from './v1/V1JobMatchingTab';
import { saveResumeVariant, resetVariantToMaster } from '@/lib/actions/applications';
import { calculateATSScore } from '@/lib/ats-scoring/client';
import type {
  JobApplication,
  ResumeVariant,
  MasterResume,
  AiAnalysis,
  ATSAnalysis,
  PersonalInfo,
  ExperienceEntry,
  EducationEntry,
  SkillEntry,
  LanguageEntry,
  CertificationEntry,
  ProjectEntry,
  ResumeSection,
  TemplateId,
  DesignSettings,
  ClientScoreResult,
  IdealResume,
} from '@/types';

interface ResumeViewPageProps {
  application: JobApplication;
  variant: ResumeVariant;
  masterResume: MasterResume | null;
  analysis: AiAnalysis | null;
  v1Analysis: ATSAnalysis | null;
  labels: Record<string, string>;
}

export function ResumeViewPage({
  application,
  variant,
  masterResume,
  analysis: initialAnalysis,
  v1Analysis: initialV1Analysis,
  labels,
}: ResumeViewPageProps) {
  const t = useTranslations('resumeView');
  const tc = useTranslations('common');

  // ─── State: single source of truth ──────────────────────────────────
  const [templateId, setTemplateId] = useState<TemplateId>(variant.template_id);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(variant.personal_info);
  const [experience, setExperience] = useState<ExperienceEntry[]>(variant.experience);
  const [education, setEducation] = useState<EducationEntry[]>(variant.education);
  const [skills, setSkills] = useState<SkillEntry[]>(variant.skills);
  const [languages, setLanguages] = useState<LanguageEntry[]>(variant.languages);
  const [certifications, setCertifications] = useState<CertificationEntry[]>(variant.certifications);
  const [projects, setProjects] = useState<ProjectEntry[]>(variant.projects);
  const [includedSections, setIncludedSections] = useState<ResumeSection[]>(
    variant.included_sections ?? ['personal_info', 'experience', 'education', 'skills', 'languages', 'certifications', 'projects']
  );
  const ALL_SECTIONS: ResumeSection[] = ['personal_info', 'experience', 'education', 'skills', 'languages', 'certifications', 'projects'];
  const [sectionOrder, setSectionOrder] = useState<ResumeSection[]>(() => {
    const saved = variant.section_order?.length ? variant.section_order : variant.included_sections ?? ALL_SECTIONS;
    // Append any sections that exist but are missing from the saved order
    const missing = ALL_SECTIONS.filter(s => !saved.includes(s));
    return [...saved, ...missing];
  });
  const [designSettings, setDesignSettings] = useState<DesignSettings>(
    variant.design_settings && Object.keys(variant.design_settings).length > 0
      ? variant.design_settings
      : {
        font_family: 'Georgia',
        font_size: 10,
        line_height: 1.4,
        list_line_height: 1.2,
        accent_color: '#2E75B6',
        text_color: '#000000',
        section_spacing: 'normal',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
      }
  );

  const [analysisData, setAnalysisData] = useState<AiAnalysis | null>(initialAnalysis);
  const [v1AnalysisData, setV1AnalysisData] = useState<ATSAnalysis | null>(initialV1Analysis);
  const [activeTab, setActiveTab] = useState('preview');
  const [isDirty, setIsDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [clientScores, setClientScores] = useState<ClientScoreResult | null>(null);

  // Track if scores are stale (edits since last analysis)
  const [scoresStale, setScoresStale] = useState(false);

  // ─── Fetch saved state on mount ───────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`resume_state_${application.id}`);
      if (saved) {
        const parsed = JSON.parse(saved) as ResumeVariant;
        if (parsed.template_id) setTemplateId(parsed.template_id);
        if (parsed.personal_info) setPersonalInfo(parsed.personal_info);
        if (parsed.experience) setExperience(parsed.experience);
        if (parsed.education) setEducation(parsed.education);
        if (parsed.skills) setSkills(parsed.skills);
        if (parsed.languages) setLanguages(parsed.languages);
        if (parsed.certifications) setCertifications(parsed.certifications);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.included_sections) setIncludedSections(parsed.included_sections);
        if (parsed.section_order?.length) setSectionOrder(parsed.section_order);
        if (parsed.design_settings) setDesignSettings(parsed.design_settings);
      }
    } catch (e) {
      console.error('Failed to parse saved resume state:', e);
    }
  }, [application.id]);

  // ─── Computed current data ──────────────────────────────────────────
  const currentData: ResumeVariant = useMemo(
    () => ({
      ...variant,
      template_id: templateId,
      personal_info: personalInfo,
      experience,
      education,
      skills,
      languages,
      certifications,
      projects,
      included_sections: includedSections,
      section_order: sectionOrder,
      design_settings: designSettings,
    }),
    [variant, templateId, personalInfo, experience, education, skills, languages, certifications, projects, includedSections, sectionOrder, designSettings]
  );

  // ─── Debounced client-side scoring ──────────────────────────────────
  const scoreTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const idealResume = analysisData?.ideal_resume as IdealResume | null;
    if (!idealResume) return;

    if (scoreTimerRef.current) clearTimeout(scoreTimerRef.current);
    scoreTimerRef.current = setTimeout(() => {
      const result = calculateATSScore(currentData, idealResume, masterResume ?? undefined);
      setClientScores(result);
    }, 500);

    return () => {
      if (scoreTimerRef.current) clearTimeout(scoreTimerRef.current);
    };
  }, [currentData, analysisData?.ideal_resume, masterResume]);

  // ─── Mark dirty on any content change ───────────────────────────────
  const markDirty = useCallback(() => {
    setIsDirty(true);
    if (analysisData) setScoresStale(true);
  }, [analysisData]);

  // Beforeunload warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ─── Reset handler ─────────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    try {
      const reset = await resetVariantToMaster(application.id);
      setPersonalInfo(reset.personal_info);
      setExperience(reset.experience);
      setEducation(reset.education);
      setSkills(reset.skills);
      setLanguages(reset.languages);
      setCertifications(reset.certifications);
      setProjects(reset.projects);
      setIsDirty(true);
    } catch {
      toast.error(tc('error'));
    }
  }, [application.id, tc]);

  const [exporting, setExporting] = useState(false);

  const handleSaveAndExport = useCallback(async () => {
    setExporting(true);
    try {
      await saveResumeVariant(application.id, {
        template_id: templateId,
        personal_info: personalInfo,
        experience,
        education,
        skills,
        languages,
        certifications,
        projects,
        included_sections: includedSections,
        section_order: sectionOrder,
        design_settings: designSettings,
      });
      setIsDirty(false);
      window.open(`/api/resume/export?id=${application.id}`, '_blank');
    } catch {
      toast.error(tc('error'));
    } finally {
      setExporting(false);
    }
  }, [application.id, templateId, personalInfo, experience, education, skills, languages, certifications, projects, includedSections, sectionOrder, designSettings, tc]);

  const handleSaveResumeState = useCallback(() => {
    try {
      localStorage.setItem(`resume_state_${application.id}`, JSON.stringify(currentData));
      toast.success(t('preview.savedLocally'));
      setIsDirty(false);
    } catch (e) {
      toast.error(tc('error'));
    }
  }, [application.id, currentData, t, tc]);

  // ─── State setters that mark dirty ─────────────────────────────────
  const updatePersonalInfo = useCallback((v: PersonalInfo) => { setPersonalInfo(v); markDirty(); }, [markDirty]);
  const updateExperience = useCallback((v: ExperienceEntry[]) => { setExperience(v); markDirty(); }, [markDirty]);
  const updateEducation = useCallback((v: EducationEntry[]) => { setEducation(v); markDirty(); }, [markDirty]);
  const updateSkills = useCallback((v: SkillEntry[]) => { setSkills(v); markDirty(); }, [markDirty]);
  const updateLanguages = useCallback((v: LanguageEntry[]) => { setLanguages(v); markDirty(); }, [markDirty]);
  const updateCertifications = useCallback((v: CertificationEntry[]) => { setCertifications(v); markDirty(); }, [markDirty]);
  const updateProjects = useCallback((v: ProjectEntry[]) => { setProjects(v); markDirty(); }, [markDirty]);
  const updateIncludedSections = useCallback((v: ResumeSection[]) => { setIncludedSections(v); markDirty(); }, [markDirty]);
  const updateSectionOrder = useCallback((v: ResumeSection[]) => { setSectionOrder(v); markDirty(); }, [markDirty]);
  const updateDesignSettings = useCallback((v: DesignSettings) => { setDesignSettings(v); markDirty(); }, [markDirty]);
  const updateTemplateId = useCallback((v: TemplateId) => { setTemplateId(v); markDirty(); }, [markDirty]);

  // ─── Score Computation ──────────────────────────────────────────
  const score = v1AnalysisData?.ats_score ?? analysisData?.ats_score ?? clientScores?.composite ?? 0;
  const isEstimate = !v1AnalysisData && !analysisData?.detailed_scores && !!clientScores;
  const antiSpamPenalty = analysisData?.anti_spam_penalty ?? clientScores?.anti_spam_penalty ?? 0;
  const scoreColor =
    score >= 75 ? 'text-green-600' :
      score >= 60 ? 'text-yellow-500' :
        score >= 40 ? 'text-orange-500' :
          'text-red-600';

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-3 shrink-0">
        <div className="min-w-0 flex items-center gap-4">
          <h1 className="text-lg font-semibold truncate">
            {application.job_title} <span className="text-muted-foreground font-normal">{t('preview.at')}</span> {application.company}
          </h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="shrink-0 text-muted-foreground hover:text-foreground">
                <FileText className="mr-1 h-3.5 w-3.5" />
                {t('preview.viewJobDescription')}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-xl lg:min-w-2xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <div className='flex items-center gap-4'>
                  <DialogTitle>{t('preview.jobDescription')}</DialogTitle>
                  {(application.location || application.salary_range || application.job_url) && (
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {application.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {application.location}
                        </span>
                      )}
                      {application.salary_range && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {application.salary_range}
                        </span>
                      )}
                      {application.job_url && (
                        <a
                          href={application.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {t('preview.jobUrl')}
                        </a>
                      )}
                    </div>
                  )}

                </div>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto space-y-4">
                {application.job_description ? (
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                    {application.job_description}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    {t('preview.noJobDescription')}
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {(analysisData || clientScores) ? (
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <span className={`text-lg font-bold ${scoreColor}`}>{Math.round(score)}</span>
              <span className="text-xs text-muted-foreground">{t('matching.atsScore')}</span>
              {isEstimate && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  {t('matching.estimatedScore')}
                </Badge>
              )}
              {antiSpamPenalty < 0 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 text-red-600 border-red-300">
                  {antiSpamPenalty}
                </Badge>
              )}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              {t('preview.unsavedChanges')}
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={handleSaveResumeState}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {t('preview.saveResume')}
          </Button>
          <Button size="sm" variant="default" onClick={handleSaveAndExport} disabled={exporting}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {exporting ? tc('saving') : t('preview.saveAndExport')}
          </Button>
          {/* Mobile preview toggle */}
          <Button
            size="sm"
            variant="outline"
            className="lg:hidden"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
            {showPreview ? t('preview.hidePreview') : t('preview.showPreview')}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left panel */}
        <div className={`flex-1 flex flex-col min-h-0 min-w-0 ${showPreview ? 'hidden lg:flex' : ''}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col min-h-0 flex-1">
            <TabsList className="shrink-0 w-full justify-start">
              <TabsTrigger value="preview">{t('tabs.preview')}</TabsTrigger>
              <TabsTrigger value="design">{t('tabs.design')}</TabsTrigger>
              <TabsTrigger value="matching">{t('tabs.jobMatching')}</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 overflow-y-auto mt-3 pr-1">
              <PreviewTab
                personalInfo={personalInfo}
                experience={experience}
                education={education}
                skills={skills}
                languages={languages}
                certifications={certifications}
                projects={projects}
                includedSections={includedSections}
                sectionOrder={sectionOrder}
                onPersonalInfoChange={updatePersonalInfo}
                onExperienceChange={updateExperience}
                onEducationChange={updateEducation}
                onSkillsChange={updateSkills}
                onLanguagesChange={updateLanguages}
                onCertificationsChange={updateCertifications}
                onProjectsChange={updateProjects}
                onReset={handleReset}
              />
            </TabsContent>

            <TabsContent value="design" className="flex-1 overflow-y-auto mt-3 pr-1">
              <DesignTab
                templateId={templateId}
                designSettings={designSettings}
                includedSections={includedSections}
                sectionOrder={sectionOrder}
                analysisData={analysisData}
                onTemplateChange={updateTemplateId}
                onDesignSettingsChange={updateDesignSettings}
                onIncludedSectionsChange={updateIncludedSections}
                onSectionOrderChange={updateSectionOrder}
              />
            </TabsContent>

            <TabsContent value="matching" className="flex-1 overflow-y-auto mt-3 pr-1">
              <V1JobMatchingTab
                application={application}
                currentVariant={currentData}
                v1Analysis={v1AnalysisData}
                onV1AnalysisUpdate={setV1AnalysisData}
                onVariantUpdate={(updated) => {
                  setPersonalInfo(updated.personal_info);
                  setExperience(updated.experience);
                  setEducation(updated.education);
                  setSkills(updated.skills);
                  setLanguages(updated.languages);
                  setCertifications(updated.certifications);
                  setProjects(updated.projects);
                  if (updated.included_sections) setIncludedSections(updated.included_sections);
                  if (updated.section_order?.length) setSectionOrder(updated.section_order);
                  markDirty();
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel: live preview */}
        <div className={`w-1/2 min-h-0 border rounded-lg bg-muted/30 overflow-y-auto p-4 ${showPreview ? '' : 'hidden lg:block'}`}>
          <ResumePreview data={currentData} labels={labels} />
        </div>
      </div>
    </div>
  );
}
