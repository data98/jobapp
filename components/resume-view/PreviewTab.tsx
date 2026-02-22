'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, RotateCcw, CheckCircle2, AlertTriangle, PackagePlus } from 'lucide-react';
import { hasMeasurableResult } from '@/lib/ats-scoring/client';
import { AddFromMasterModal } from './AddFromMasterModal';
import type {
  PersonalInfo,
  ExperienceEntry,
  EducationEntry,
  SkillEntry,
  LanguageEntry,
  CertificationEntry,
  ProjectEntry,
  ResumeSection,
  MasterResume,
  AiAnalysis,
  IdealResume,
  KeywordMap,
} from '@/types';

function generateId(): string {
  return crypto.randomUUID();
}

interface PreviewTabProps {
  personalInfo: PersonalInfo;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  languages: LanguageEntry[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
  includedSections: ResumeSection[];
  sectionOrder: ResumeSection[];
  masterResume: MasterResume | null;
  analysisData: AiAnalysis | null;
  saving: boolean;
  onPersonalInfoChange: (v: PersonalInfo) => void;
  onExperienceChange: (v: ExperienceEntry[]) => void;
  onEducationChange: (v: EducationEntry[]) => void;
  onSkillsChange: (v: SkillEntry[]) => void;
  onLanguagesChange: (v: LanguageEntry[]) => void;
  onCertificationsChange: (v: CertificationEntry[]) => void;
  onProjectsChange: (v: ProjectEntry[]) => void;
  onSave: () => void;
  onReset: () => void;
}

function BulletIndicator({ text }: { text: string }) {
  const t = useTranslations('resumeView.preview');
  const has = hasMeasurableResult(text);
  return has ? (
    <span title={t('hasMeasurableResult')}>
      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
    </span>
  ) : (
    <span title={t('noMeasurableResult')}>
      <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
    </span>
  );
}

function SummaryQualityBadge({ summary, idealResume }: { summary: string; idealResume: IdealResume | null }) {
  const t = useTranslations('resumeView.preview');
  if (!idealResume) return null;

  const wordCount = summary.split(/\s+/).filter(Boolean).length;
  const [min, max] = idealResume.ideal_structure.summary_length_range;

  if (wordCount === 0) return null;

  if (wordCount < min) {
    return <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">{t('tooShort')}</Badge>;
  }
  if (wordCount > max) {
    return <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">{t('tooLong')}</Badge>;
  }
  return <Badge variant="outline" className="text-green-600 border-green-300 text-xs">{t('withinIdealRange')}</Badge>;
}

function getSkillColor(skillName: string, keywordMap: KeywordMap | undefined): string {
  if (!keywordMap) return '';
  const lower = skillName.toLowerCase();
  for (const entries of Object.values(keywordMap)) {
    for (const entry of entries) {
      if (entry.keyword.toLowerCase() === lower) {
        if (entry.importance === 'critical') return 'bg-green-100 text-green-800 border-green-200';
        if (entry.importance === 'important') return 'bg-blue-100 text-blue-800 border-blue-200';
        return 'bg-gray-100 text-gray-600 border-gray-200';
      }
    }
  }
  return '';
}

export function PreviewTab({
  personalInfo,
  experience,
  education,
  skills,
  languages,
  certifications,
  projects,
  includedSections,
  sectionOrder,
  masterResume,
  analysisData,
  saving,
  onPersonalInfoChange,
  onExperienceChange,
  onEducationChange,
  onSkillsChange,
  onLanguagesChange,
  onCertificationsChange,
  onProjectsChange,
  onSave,
  onReset,
}: PreviewTabProps) {
  const t = useTranslations('resume');
  const tv = useTranslations('resumeView.preview');
  const tc = useTranslations('common');
  const [masterModalOpen, setMasterModalOpen] = useState(false);
  const [masterModalSection, setMasterModalSection] = useState<'skills' | 'experience' | 'certifications' | 'projects' | 'languages'>('skills');

  const idealResume = analysisData?.ideal_resume as IdealResume | null;
  const keywordMap = idealResume?.keyword_map;

  const summaryWordCount = personalInfo.summary.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={onSave} disabled={saving} size="sm">
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saving ? tv('saving') : tv('save')}
        </Button>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          {tv('resetToMaster')}
        </Button>
        {masterResume && (
          <Button variant="outline" size="sm" onClick={() => { setMasterModalSection('skills'); setMasterModalOpen(true); }}>
            <PackagePlus className="mr-1.5 h-3.5 w-3.5" />
            {tv('addFromMaster')}
          </Button>
        )}
      </div>

      {/* Personal Info */}
      {includedSections.includes('personal_info') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('personalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('fullName')}</Label>
                <Input value={personalInfo.fullName} onChange={(e) => onPersonalInfoChange({ ...personalInfo, fullName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('email')}</Label>
                <Input value={personalInfo.email} onChange={(e) => onPersonalInfoChange({ ...personalInfo, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('phone')}</Label>
                <Input value={personalInfo.phone} onChange={(e) => onPersonalInfoChange({ ...personalInfo, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('locationField')}</Label>
                <Input value={personalInfo.location} onChange={(e) => onPersonalInfoChange({ ...personalInfo, location: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t('summary')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{tv('wordCount', { count: summaryWordCount })}</span>
                  <SummaryQualityBadge summary={personalInfo.summary} idealResume={idealResume} />
                </div>
              </div>
              <Textarea rows={3} value={personalInfo.summary} onChange={(e) => onPersonalInfoChange({ ...personalInfo, summary: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {includedSections.includes('experience') && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">{t('experience')}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onExperienceChange([
                  { id: generateId(), company: '', title: '', startDate: '', endDate: '', current: false, location: '', bullets: [''] },
                  ...experience,
                ])
              }
            >
              <Plus className="mr-1 h-3 w-3" />
              {t('addEntry', { section: t('experience') })}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {experience.map((exp, idx) => (
              <div key={exp.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onExperienceChange(experience.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder={t('companyName')} value={exp.company} onChange={(e) => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, company: e.target.value } : x))} />
                  <Input placeholder={t('jobTitleField')} value={exp.title} onChange={(e) => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} />
                  <Input type="month" value={exp.startDate} onChange={(e) => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, startDate: e.target.value } : x))} />
                  <Input type="month" value={exp.endDate} disabled={exp.current} onChange={(e) => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, endDate: e.target.value } : x))} />
                </div>
                <Separator />
                <div className="space-y-1">
                  {exp.bullets.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-1">
                      <BulletIndicator text={b} />
                      <Input
                        value={b}
                        className="text-xs"
                        onChange={(e) =>
                          onExperienceChange(experience.map((x, i) => i === idx ? { ...x, bullets: x.bullets.map((bb, bi) => bi === bIdx ? e.target.value : bb) } : x))
                        }
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, bullets: x.bullets.filter((_, bi) => bi !== bIdx) } : x))}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, bullets: [...x.bullets, ''] } : x))}>
                    <Plus className="mr-1 h-3 w-3" />
                    {t('addBullet')}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {includedSections.includes('education') && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">{t('education')}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => onEducationChange([{ id: generateId(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' }, ...education])}>
              <Plus className="mr-1 h-3 w-3" />
              {t('addEntry', { section: t('education') })}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {education.map((edu, idx) => (
              <div key={edu.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEducationChange(education.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder={t('institution')} value={edu.institution} onChange={(e) => onEducationChange(education.map((x, i) => i === idx ? { ...x, institution: e.target.value } : x))} />
                  <Input placeholder={t('degree')} value={edu.degree} onChange={(e) => onEducationChange(education.map((x, i) => i === idx ? { ...x, degree: e.target.value } : x))} />
                  <Input placeholder={t('fieldOfStudy')} value={edu.field} onChange={(e) => onEducationChange(education.map((x, i) => i === idx ? { ...x, field: e.target.value } : x))} />
                  <Input placeholder={t('gpa')} value={edu.gpa} onChange={(e) => onEducationChange(education.map((x, i) => i === idx ? { ...x, gpa: e.target.value } : x))} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {includedSections.includes('skills') && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">{t('skills')}</CardTitle>
            <div className="flex gap-2">
              {masterResume && (
                <Button variant="outline" size="sm" onClick={() => { setMasterModalSection('skills'); setMasterModalOpen(true); }}>
                  <PackagePlus className="mr-1 h-3 w-3" />
                  {tv('addFromMaster')}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => onSkillsChange([{ id: generateId(), name: '' }, ...skills])}>
                <Plus className="mr-1 h-3 w-3" />
                {t('addEntry', { section: t('skills') })}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <div key={skill.id} className={`flex items-center gap-1 border rounded-full px-2.5 py-0.5 text-xs ${getSkillColor(skill.name, keywordMap)}`}>
                  <Input
                    value={skill.name}
                    className="border-0 bg-transparent h-5 text-xs p-0 w-24 focus-visible:ring-0"
                    onChange={(e) => onSkillsChange(skills.map((s, i) => i === idx ? { ...s, name: e.target.value } : s))}
                  />
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => onSkillsChange(skills.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Languages */}
      {includedSections.includes('languages') && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">{t('languages')}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => onLanguagesChange([{ id: generateId(), language: '', proficiency: '' }, ...languages])}>
              <Plus className="mr-1 h-3 w-3" />
              {t('addEntry', { section: t('languages') })}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {languages.map((lang, idx) => (
              <div key={lang.id} className="flex gap-2">
                <Input placeholder={t('language')} value={lang.language} onChange={(e) => onLanguagesChange(languages.map((l, i) => i === idx ? { ...l, language: e.target.value } : l))} />
                <Input placeholder={t('proficiency')} value={lang.proficiency} onChange={(e) => onLanguagesChange(languages.map((l, i) => i === idx ? { ...l, proficiency: e.target.value } : l))} />
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => onLanguagesChange(languages.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {includedSections.includes('certifications') && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">{t('certifications')}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => onCertificationsChange([{ id: generateId(), name: '', issuer: '', date: '', url: '' }, ...certifications])}>
              <Plus className="mr-1 h-3 w-3" />
              {t('addEntry', { section: t('certifications') })}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {certifications.map((cert, idx) => (
              <div key={cert.id} className="flex gap-2 items-start">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <Input placeholder={t('certName')} value={cert.name} onChange={(e) => onCertificationsChange(certifications.map((c, i) => i === idx ? { ...c, name: e.target.value } : c))} />
                  <Input placeholder={t('issuer')} value={cert.issuer} onChange={(e) => onCertificationsChange(certifications.map((c, i) => i === idx ? { ...c, issuer: e.target.value } : c))} />
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => onCertificationsChange(certifications.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      {includedSections.includes('projects') && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">{t('projects')}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => onProjectsChange([{ id: generateId(), name: '', description: '', url: '', bullets: [''] }, ...projects])}>
              <Plus className="mr-1 h-3 w-3" />
              {t('addEntry', { section: t('projects') })}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.map((proj, idx) => (
              <div key={proj.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onProjectsChange(projects.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder={t('projectName')} value={proj.name} onChange={(e) => onProjectsChange(projects.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))} />
                  <Input placeholder={t('projectUrl')} value={proj.url} onChange={(e) => onProjectsChange(projects.map((p, i) => i === idx ? { ...p, url: e.target.value } : p))} />
                </div>
                <Textarea placeholder={t('description')} value={proj.description} rows={2} onChange={(e) => onProjectsChange(projects.map((p, i) => i === idx ? { ...p, description: e.target.value } : p))} />
                <div className="space-y-1">
                  {proj.bullets.map((b, bIdx) => (
                    <div key={bIdx} className="flex items-center gap-1">
                      <BulletIndicator text={b} />
                      <Input value={b} className="text-xs" onChange={(e) => onProjectsChange(projects.map((p, i) => i === idx ? { ...p, bullets: p.bullets.map((bb, bi) => bi === bIdx ? e.target.value : bb) } : p))} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onProjectsChange(projects.map((p, i) => i === idx ? { ...p, bullets: p.bullets.filter((_, bi) => bi !== bIdx) } : p))}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => onProjectsChange(projects.map((p, i) => i === idx ? { ...p, bullets: [...p.bullets, ''] } : p))}>
                    <Plus className="mr-1 h-3 w-3" />
                    {t('addBullet')}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add from Master Modal */}
      {masterResume && (
        <AddFromMasterModal
          open={masterModalOpen}
          onOpenChange={setMasterModalOpen}
          section={masterModalSection}
          masterResume={masterResume}
          currentSkills={skills}
          currentExperience={experience}
          currentCertifications={certifications}
          currentProjects={projects}
          currentLanguages={languages}
          keywordMap={keywordMap ?? null}
          onAddSkills={(newSkills) => onSkillsChange([...skills, ...newSkills])}
          onAddExperience={(entries) => onExperienceChange([...experience, ...entries])}
          onAddCertifications={(entries) => onCertificationsChange([...certifications, ...entries])}
          onAddProjects={(entries) => onProjectsChange([...projects, ...entries])}
          onAddLanguages={(entries) => onLanguagesChange([...languages, ...entries])}
        />
      )}
    </div>
  );
}
