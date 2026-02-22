'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Download } from 'lucide-react';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { PreviewTab } from './PreviewTab';
import { DesignTab } from './DesignTab';
import { JobMatchingTab } from './JobMatchingTab';
import { BottomScoreBar } from './BottomScoreBar';
import { saveResumeVariant, resetVariantToMaster } from '@/lib/actions/applications';
import { calculateATSScore } from '@/lib/ats-scoring/client';
import type {
  JobApplication,
  ResumeVariant,
  MasterResume,
  AiAnalysis,
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
  labels: Record<string, string>;
}

export function ResumeViewPage({
  application,
  variant,
  masterResume,
  analysis: initialAnalysis,
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
    variant.included_sections ?? ['personal_info', 'experience', 'education', 'skills']
  );
  const [sectionOrder, setSectionOrder] = useState<ResumeSection[]>(
    variant.section_order?.length
      ? variant.section_order
      : variant.included_sections ?? ['personal_info', 'experience', 'education', 'skills', 'languages', 'certifications', 'projects']
  );
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
  const [activeTab, setActiveTab] = useState('preview');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [clientScores, setClientScores] = useState<ClientScoreResult | null>(null);

  // Track if scores are stale (edits since last analysis)
  const [scoresStale, setScoresStale] = useState(false);

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

  // ─── Save handler ──────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
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
      toast.success(tc('saved'));
    } catch {
      toast.error(tc('error'));
    } finally {
      setSaving(false);
    }
  }, [application.id, templateId, personalInfo, experience, education, skills, languages, certifications, projects, includedSections, sectionOrder, designSettings, tc]);

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

  const handleExport = useCallback(() => {
    window.open(`/api/resume/export?id=${application.id}`, '_blank');
  }, [application.id]);

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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pb-3 shrink-0">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate">
            {application.job_title} <span className="text-muted-foreground font-normal">at</span> {application.company}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              {t('preview.unsavedChanges')}
            </Badge>
          )}
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t('preview.save').includes('Save') ? 'Export PDF' : t('preview.save')}
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
                masterResume={masterResume}
                analysisData={analysisData}
                saving={saving}
                onPersonalInfoChange={updatePersonalInfo}
                onExperienceChange={updateExperience}
                onEducationChange={updateEducation}
                onSkillsChange={updateSkills}
                onLanguagesChange={updateLanguages}
                onCertificationsChange={updateCertifications}
                onProjectsChange={updateProjects}
                onSave={handleSave}
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
              <JobMatchingTab
                application={application}
                currentVariant={currentData}
                masterResume={masterResume}
                analysisData={analysisData}
                clientScores={clientScores}
                scoresStale={scoresStale}
                onAnalysisUpdate={setAnalysisData}
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
                onScoresStaleChange={setScoresStale}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel: live preview */}
        <div className={`w-1/2 min-h-0 border rounded-lg bg-muted/30 overflow-y-auto p-4 ${showPreview ? '' : 'hidden lg:block'}`}>
          <ResumePreview data={currentData} labels={labels} />
        </div>
      </div>

      {/* Bottom score bar */}
      <BottomScoreBar
        analysisData={analysisData}
        clientScores={clientScores}
        scoresStale={scoresStale}
      />
    </div>
  );
}
