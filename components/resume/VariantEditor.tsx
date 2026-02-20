'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, RotateCcw, Download } from 'lucide-react';
import { TemplateSelector } from './TemplateSelector';
import { ResumePreview } from './ResumePreview';
import { saveResumeVariant, resetVariantToMaster } from '@/lib/actions/applications';
import type {
  PersonalInfo,
  ExperienceEntry,
  EducationEntry,
  SkillEntry,
  LanguageEntry,
  CertificationEntry,
  ProjectEntry,
  ResumeVariant,
  ResumeSection,
  TemplateId,
} from '@/types';

function generateId(): string {
  return crypto.randomUUID();
}

interface VariantEditorProps {
  variant: ResumeVariant;
  jobApplicationId: string;
  labels: Record<string, string>;
}

const ALL_SECTIONS: ResumeSection[] = [
  'personal_info',
  'experience',
  'education',
  'skills',
  'languages',
  'certifications',
  'projects',
];

export function VariantEditor({ variant, jobApplicationId, labels }: VariantEditorProps) {
  const t = useTranslations('resume');
  const tc = useTranslations('common');
  const [saving, setSaving] = useState(false);

  const [templateId, setTemplateId] = useState<TemplateId>(variant.template_id);
  const [includedSections, setIncludedSections] = useState<ResumeSection[]>(
    variant.included_sections ?? ALL_SECTIONS
  );
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(variant.personal_info);
  const [experience, setExperience] = useState<ExperienceEntry[]>(variant.experience);
  const [education, setEducation] = useState<EducationEntry[]>(variant.education);
  const [skills, setSkills] = useState<SkillEntry[]>(variant.skills);
  const [languages, setLanguages] = useState<LanguageEntry[]>(variant.languages);
  const [certifications, setCertifications] = useState<CertificationEntry[]>(variant.certifications);
  const [projects, setProjects] = useState<ProjectEntry[]>(variant.projects);

  const currentData: ResumeVariant = {
    ...variant,
    template_id: templateId,
    included_sections: includedSections,
    personal_info: personalInfo,
    experience,
    education,
    skills,
    languages,
    certifications,
    projects,
  };

  const toggleSection = (section: ResumeSection) => {
    setIncludedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveResumeVariant(jobApplicationId, {
        template_id: templateId,
        included_sections: includedSections,
        personal_info: personalInfo,
        experience,
        education,
        skills,
        languages,
        certifications,
        projects,
      });
      toast.success(t('resumeSaved'));
    } catch {
      toast.error(tc('error'));
    } finally {
      setSaving(false);
    }
  }, [templateId, includedSections, personalInfo, experience, education, skills, languages, certifications, projects, jobApplicationId, t, tc]);

  const handleReset = async () => {
    try {
      const reset = await resetVariantToMaster(jobApplicationId);
      setPersonalInfo(reset.personal_info);
      setExperience(reset.experience);
      setEducation(reset.education);
      setSkills(reset.skills);
      setLanguages(reset.languages);
      setCertifications(reset.certifications);
      setProjects(reset.projects);
      toast.success(t('resumeSaved'));
    } catch {
      toast.error(tc('error'));
    }
  };

  const handleExport = () => {
    window.open(`/api/resume/export?id=${jobApplicationId}`, '_blank');
  };

  const sectionLabelMap: Record<ResumeSection, string> = {
    personal_info: t('personalInfo'),
    experience: t('experience'),
    education: t('education'),
    skills: t('skills'),
    languages: t('languages'),
    certifications: t('certifications'),
    projects: t('projects'),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Editor */}
      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {saving ? tc('saving') : tc('save')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t('resetToMaster')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {t('exportPdf')}
          </Button>
        </div>

        {/* Template selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('selectTemplate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateSelector value={templateId} onChange={setTemplateId} />
          </CardContent>
        </Card>

        {/* Section toggles */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              {ALL_SECTIONS.map((section) => (
                <label key={section} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includedSections.includes(section)}
                    onChange={() => toggleSection(section)}
                    className="h-4 w-4"
                  />
                  {sectionLabelMap[section]}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

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
                  <Input value={personalInfo.fullName} onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('email')}</Label>
                  <Input value={personalInfo.email} onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('phone')}</Label>
                  <Input value={personalInfo.phone} onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('locationField')}</Label>
                  <Input value={personalInfo.location} onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('summary')}</Label>
                <Textarea rows={3} value={personalInfo.summary} onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })} />
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
                  setExperience((prev) => [
                    ...prev,
                    { id: generateId(), company: '', title: '', startDate: '', endDate: '', current: false, location: '', bullets: [''] },
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
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExperience((p) => p.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder={t('companyName')} value={exp.company} onChange={(e) => setExperience((p) => p.map((x, i) => (i === idx ? { ...x, company: e.target.value } : x)))} />
                    <Input placeholder={t('jobTitleField')} value={exp.title} onChange={(e) => setExperience((p) => p.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))} />
                    <Input type="month" value={exp.startDate} onChange={(e) => setExperience((p) => p.map((x, i) => (i === idx ? { ...x, startDate: e.target.value } : x)))} />
                    <Input type="month" value={exp.endDate} disabled={exp.current} onChange={(e) => setExperience((p) => p.map((x, i) => (i === idx ? { ...x, endDate: e.target.value } : x)))} />
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    {exp.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex gap-1">
                        <Input
                          value={b}
                          className="text-xs"
                          onChange={(e) =>
                            setExperience((p) =>
                              p.map((x, i) => (i === idx ? { ...x, bullets: x.bullets.map((bb, bi) => (bi === bIdx ? e.target.value : bb)) } : x))
                            )
                          }
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setExperience((p) => p.map((x, i) => (i === idx ? { ...x, bullets: x.bullets.filter((_, bi) => bi !== bIdx) } : x)))}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setExperience((p) => p.map((x, i) => (i === idx ? { ...x, bullets: [...x.bullets, ''] } : x)))}>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEducation((prev) => [
                    ...prev,
                    { id: generateId(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' },
                  ])
                }
              >
                <Plus className="mr-1 h-3 w-3" />
                {t('addEntry', { section: t('education') })}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {education.map((edu, idx) => (
                <div key={edu.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEducation((p) => p.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder={t('institution')} value={edu.institution} onChange={(e) => setEducation((p) => p.map((x, i) => (i === idx ? { ...x, institution: e.target.value } : x)))} />
                    <Input placeholder={t('degree')} value={edu.degree} onChange={(e) => setEducation((p) => p.map((x, i) => (i === idx ? { ...x, degree: e.target.value } : x)))} />
                    <Input placeholder={t('fieldOfStudy')} value={edu.field} onChange={(e) => setEducation((p) => p.map((x, i) => (i === idx ? { ...x, field: e.target.value } : x)))} />
                    <Input placeholder={t('gpa')} value={edu.gpa} onChange={(e) => setEducation((p) => p.map((x, i) => (i === idx ? { ...x, gpa: e.target.value } : x)))} />
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
              <Button variant="outline" size="sm" onClick={() => setSkills((p) => [...p, { id: generateId(), name: '' }])}>
                <Plus className="mr-1 h-3 w-3" />
                {t('addEntry', { section: t('skills') })}
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {skills.map((skill, idx) => (
                <div key={skill.id} className="flex gap-2">
                  <Input value={skill.name} onChange={(e) => setSkills((p) => p.map((s, i) => (i === idx ? { ...s, name: e.target.value } : s)))} />
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setSkills((p) => p.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Languages */}
        {includedSections.includes('languages') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm">{t('languages')}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setLanguages((p) => [...p, { id: generateId(), language: '', proficiency: '' }])}>
                <Plus className="mr-1 h-3 w-3" />
                {t('addEntry', { section: t('languages') })}
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {languages.map((lang, idx) => (
                <div key={lang.id} className="flex gap-2">
                  <Input placeholder={t('language')} value={lang.language} onChange={(e) => setLanguages((p) => p.map((l, i) => (i === idx ? { ...l, language: e.target.value } : l)))} />
                  <Input placeholder={t('proficiency')} value={lang.proficiency} onChange={(e) => setLanguages((p) => p.map((l, i) => (i === idx ? { ...l, proficiency: e.target.value } : l)))} />
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setLanguages((p) => p.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: Live Preview */}
      <div className="overflow-y-auto max-h-[calc(100vh-12rem)] border rounded-lg bg-gray-50 p-4">
        <ResumePreview data={currentData} labels={labels} />
      </div>
    </div>
  );
}
