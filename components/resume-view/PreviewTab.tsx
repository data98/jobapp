'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, RotateCcw, CheckCircle2, AlertTriangle, ChevronDown } from 'lucide-react';
import { hasMeasurableResult } from '@/lib/ats-scoring/client';

import type {
  PersonalInfo,
  PersonalInfoField,
  ExperienceEntry,
  ExperienceField,
  EducationEntry,
  SkillEntry,
  LanguageEntry,
  CertificationEntry,
  ProjectEntry,
  ResumeSection,

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

  analysisData: AiAnalysis | null;
  onPersonalInfoChange: (v: PersonalInfo) => void;
  onExperienceChange: (v: ExperienceEntry[]) => void;
  onEducationChange: (v: EducationEntry[]) => void;
  onSkillsChange: (v: SkillEntry[]) => void;
  onLanguagesChange: (v: LanguageEntry[]) => void;
  onCertificationsChange: (v: CertificationEntry[]) => void;
  onProjectsChange: (v: ProjectEntry[]) => void;
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
        if (entry.importance === 'critical') return 'border-green-400/50';
        if (entry.importance === 'important') return 'border-blue-400/50';
        return 'border-gray-400';
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

  analysisData,
  onPersonalInfoChange,
  onExperienceChange,
  onEducationChange,
  onSkillsChange,
  onLanguagesChange,
  onCertificationsChange,
  onProjectsChange,
  onReset,
}: PreviewTabProps) {
  const t = useTranslations('resume');
  const tv = useTranslations('resumeView.preview');
  const tc = useTranslations('common');


  const idealResume = analysisData?.ideal_resume as IdealResume | null;
  const keywordMap = idealResume?.keyword_map;

  const summaryWordCount = personalInfo.summary.split(/\s+/).filter(Boolean).length;

  const hiddenFields = personalInfo.hiddenFields ?? [];
  const isFieldHidden = (field: PersonalInfoField) => hiddenFields.includes(field);
  const togglePersonalField = (field: PersonalInfoField) => {
    const current = personalInfo.hiddenFields ?? [];
    const next = current.includes(field)
      ? current.filter(f => f !== field)
      : [...current, field];
    onPersonalInfoChange({ ...personalInfo, hiddenFields: next });
  };

  const toggleExpHidden = (idx: number) => {
    onExperienceChange(experience.map((x, i) => i === idx ? { ...x, hidden: !x.hidden } : x));
  };

  const isExpFieldHidden = (exp: ExperienceEntry, field: ExperienceField) =>
    (exp.hiddenFields ?? []).includes(field);

  const toggleExpField = (idx: number, field: ExperienceField) => {
    onExperienceChange(experience.map((x, i) => {
      if (i !== idx) return x;
      const current = x.hiddenFields ?? [];
      const next = current.includes(field)
        ? current.filter(f => f !== field)
        : [...current, field];
      return { ...x, hiddenFields: next };
    }));
  };

  const toggleExpBulletHidden = (expIdx: number, bulletIdx: number) => {
    onExperienceChange(experience.map((x, i) => {
      if (i !== expIdx) return x;
      const current = x.hiddenBullets ?? [];
      const next = current.includes(bulletIdx)
        ? current.filter(b => b !== bulletIdx)
        : [...current, bulletIdx];
      return { ...x, hiddenBullets: next };
    }));
  };

  const toggleEduHidden = (idx: number) => {
    onEducationChange(education.map((x, i) => i === idx ? { ...x, hidden: !x.hidden } : x));
  };

  const toggleSkillHidden = (idx: number) => {
    onSkillsChange(skills.map((s, i) => i === idx ? { ...s, hidden: !s.hidden } : s));
  };

  const toggleLangHidden = (idx: number) => {
    onLanguagesChange(languages.map((l, i) => i === idx ? { ...l, hidden: !l.hidden } : l));
  };

  const toggleCertHidden = (idx: number) => {
    onCertificationsChange(certifications.map((c, i) => i === idx ? { ...c, hidden: !c.hidden } : c));
  };

  const toggleProjHidden = (idx: number) => {
    onProjectsChange(projects.map((p, i) => i === idx ? { ...p, hidden: !p.hidden } : p));
  };

  const toggleProjBulletHidden = (projIdx: number, bulletIdx: number) => {
    onProjectsChange(projects.map((p, i) => {
      if (i !== projIdx) return p;
      const current = p.hiddenBullets ?? [];
      const next = current.includes(bulletIdx)
        ? current.filter(b => b !== bulletIdx)
        : [...current, bulletIdx];
      return { ...p, hiddenBullets: next };
    }));
  };

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          {tv('resetToMaster')}
        </Button>
      </div>

      {/* Personal Info */}
      {includedSections.includes('personal_info') && (
        <Card>
          <CardContent>
            <Collapsible defaultOpen className="group/collapsible">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="group w-full justify-start text-sm font-semibold">
                  {t('personalInfo')}
                  <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                {/* Full name */}
                <div className={`space-y-1 ${isFieldHidden('fullName') ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!isFieldHidden('fullName')}
                      onCheckedChange={() => togglePersonalField('fullName')}
                    />
                    <Label className="text-xs">{t('fullName')}</Label>
                  </div>
                  <Input value={personalInfo.fullName} onChange={(e) => onPersonalInfoChange({ ...personalInfo, fullName: e.target.value })} />
                </div>

                {/* Email */}
                <div className={`space-y-1 ${isFieldHidden('email') ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!isFieldHidden('email')}
                      onCheckedChange={() => togglePersonalField('email')}
                    />
                    <Label className="text-xs">{t('email')}</Label>
                  </div>
                  <Input value={personalInfo.email} onChange={(e) => onPersonalInfoChange({ ...personalInfo, email: e.target.value })} />
                </div>

                {/* Phone */}
                <div className={`space-y-1 ${isFieldHidden('phone') ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!isFieldHidden('phone')}
                      onCheckedChange={() => togglePersonalField('phone')}
                    />
                    <Label className="text-xs">{t('phone')}</Label>
                  </div>
                  <Input value={personalInfo.phone} onChange={(e) => onPersonalInfoChange({ ...personalInfo, phone: e.target.value })} />
                </div>

                {/* Location */}
                <div className={`space-y-1 ${isFieldHidden('location') ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!isFieldHidden('location')}
                      onCheckedChange={() => togglePersonalField('location')}
                    />
                    <Label className="text-xs">{t('locationField')}</Label>
                  </div>
                  <Input value={personalInfo.location} onChange={(e) => onPersonalInfoChange({ ...personalInfo, location: e.target.value })} />
                </div>

                {/* LinkedIn */}
                <div className={`space-y-1 ${isFieldHidden('linkedIn') ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!isFieldHidden('linkedIn')}
                      onCheckedChange={() => togglePersonalField('linkedIn')}
                    />
                    <Label className="text-xs">{t('linkedIn')}</Label>
                  </div>
                  <Input value={personalInfo.linkedIn} onChange={(e) => onPersonalInfoChange({ ...personalInfo, linkedIn: e.target.value })} />
                </div>

                {/* Portfolio */}
                <div className={`space-y-1 ${isFieldHidden('portfolio') ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={!isFieldHidden('portfolio')}
                      onCheckedChange={() => togglePersonalField('portfolio')}
                    />
                    <Label className="text-xs">{t('portfolio')}</Label>
                  </div>
                  <Input value={personalInfo.portfolio} onChange={(e) => onPersonalInfoChange({ ...personalInfo, portfolio: e.target.value })} />
                </div>

                {/* Summary */}
                <div className={`space-y-1 ${isFieldHidden('summary') ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!isFieldHidden('summary')}
                        onCheckedChange={() => togglePersonalField('summary')}
                      />
                      <Label className="text-xs">{t('summary')}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{tv('wordCount', { count: summaryWordCount })}</span>
                      <SummaryQualityBadge summary={personalInfo.summary} idealResume={idealResume} />
                    </div>
                  </div>
                  <Textarea rows={3} value={personalInfo.summary} onChange={(e) => onPersonalInfoChange({ ...personalInfo, summary: e.target.value })} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {includedSections.includes('experience') && (
        <Card>
          <CardContent>
            <Collapsible defaultOpen className="group/collapsible">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="group w-full justify-start text-sm font-semibold">
                  {t('experience')}
                  <Badge variant="secondary" className="ml-2 text-xs">{experience.length}</Badge>
                  <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
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
                {experience.map((exp, idx) => (
                  <div key={`${exp.id}-${idx}`} className={`border rounded-lg p-3 space-y-2 ${exp.hidden ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!exp.hidden}
                        onCheckedChange={() => toggleExpHidden(idx)}
                      />
                      <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`flex items-center gap-1.5 ${isExpFieldHidden(exp, 'company') ? 'opacity-50' : ''}`}>
                        <Checkbox className="h-3.5 w-3.5 shrink-0" checked={!isExpFieldHidden(exp, 'company')} onCheckedChange={() => toggleExpField(idx, 'company')} />
                        <Input placeholder={t('companyName')} value={exp.company} onChange={(e) => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, company: e.target.value } : x))} />
                      </div>
                      <div className={`flex items-center gap-1.5 ${isExpFieldHidden(exp, 'title') ? 'opacity-50' : ''}`}>
                        <Checkbox className="h-3.5 w-3.5 shrink-0" checked={!isExpFieldHidden(exp, 'title')} onCheckedChange={() => toggleExpField(idx, 'title')} />
                        <Input placeholder={t('jobTitleField')} value={exp.title} onChange={(e) => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} />
                      </div>
                      <div className={`flex items-center gap-1.5 ${isExpFieldHidden(exp, 'startDate') ? 'opacity-50' : ''}`}>
                        <Checkbox className="h-3.5 w-3.5 shrink-0" checked={!isExpFieldHidden(exp, 'startDate')} onCheckedChange={() => toggleExpField(idx, 'startDate')} />
                        <Input type="month" value={exp.startDate} onChange={(e) => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, startDate: e.target.value } : x))} />
                      </div>
                      <div className={`flex items-center gap-1.5 ${isExpFieldHidden(exp, 'endDate') ? 'opacity-50' : ''}`}>
                        <Checkbox className="h-3.5 w-3.5 shrink-0" checked={!isExpFieldHidden(exp, 'endDate')} onCheckedChange={() => toggleExpField(idx, 'endDate')} />
                        <Input type="month" value={exp.endDate} disabled={exp.current} onChange={(e) => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, endDate: e.target.value } : x))} />
                      </div>
                      <div className={`col-span-2 flex items-center gap-1.5 ${isExpFieldHidden(exp, 'location') ? 'opacity-50' : ''}`}>
                        <Checkbox className="h-3.5 w-3.5 shrink-0" checked={!isExpFieldHidden(exp, 'location')} onCheckedChange={() => toggleExpField(idx, 'location')} />
                        <Input placeholder={t('locationField')} value={exp.location} onChange={(e) => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, location: e.target.value } : x))} />
                      </div>
                    </div>
                    {/* Description/paragraph */}
                    <div className={`flex items-start gap-1.5 ${isExpFieldHidden(exp, 'description') ? 'opacity-50' : ''}`}>
                      <Checkbox className="h-3.5 w-3.5 shrink-0 mt-2.5" checked={!isExpFieldHidden(exp, 'description')} onCheckedChange={() => toggleExpField(idx, 'description')} />
                      <Textarea
                        className="flex-1"
                        placeholder={t('description')}
                        value={exp.description ?? ''}
                        rows={2}
                        onChange={(e) => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                      />
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      {exp.bullets.map((b, bIdx) => {
                        const bulletHidden = exp.hiddenBullets?.includes(bIdx) ?? false;
                        return (
                          <div key={bIdx} className={`flex items-center gap-1 ${bulletHidden ? 'opacity-50' : ''}`}>
                            <Checkbox
                              checked={!bulletHidden}
                              onCheckedChange={() => toggleExpBulletHidden(idx, bIdx)}
                            />
                            <Input
                              value={b}
                              className="text-xs"
                              onChange={(e) =>
                                onExperienceChange(experience.map((x, i) => i === idx ? { ...x, bullets: x.bullets.map((bb, bi) => bi === bIdx ? e.target.value : bb) } : x))
                              }
                            />
                            <BulletIndicator text={b} />
                          </div>
                        );
                      })}
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => onExperienceChange(experience.map((x, i) => i === idx ? { ...x, bullets: [...x.bullets, ''] } : x))}>
                        <Plus className="mr-1 h-3 w-3" />
                        {t('addBullet')}
                      </Button>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {includedSections.includes('education') && (
        <Card>
          <CardContent>
            <Collapsible defaultOpen className="group/collapsible">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="group w-full justify-start text-sm font-semibold">
                  {t('education')}
                  <Badge variant="secondary" className="ml-2 text-xs">{education.length}</Badge>
                  <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => onEducationChange([{ id: generateId(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' }, ...education])}>
                  <Plus className="mr-1 h-3 w-3" />
                  {t('addEntry', { section: t('education') })}
                </Button>
                {education.map((edu, idx) => (
                  <div key={`${edu.id}-${idx}`} className={`border rounded-lg p-3 space-y-2 ${edu.hidden ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!edu.hidden}
                        onCheckedChange={() => toggleEduHidden(idx)}
                      />
                      <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder={t('institution')} value={edu.institution} onChange={(e) => onEducationChange(education.map((x, i) => i === idx ? { ...x, institution: e.target.value } : x))} />
                      <Input placeholder={t('degree')} value={edu.degree} onChange={(e) => onEducationChange(education.map((x, i) => i === idx ? { ...x, degree: e.target.value } : x))} />
                      <Input placeholder={t('fieldOfStudy')} value={edu.field} onChange={(e) => onEducationChange(education.map((x, i) => i === idx ? { ...x, field: e.target.value } : x))} />
                      <Input placeholder={t('gpa')} value={edu.gpa} onChange={(e) => onEducationChange(education.map((x, i) => i === idx ? { ...x, gpa: e.target.value } : x))} />
                      <Input type="month" placeholder={t('startDate')} value={edu.startDate} onChange={(e) => onEducationChange(education.map((x, i) => i === idx ? { ...x, startDate: e.target.value } : x))} />
                      <Input type="month" placeholder={t('endDate')} value={edu.endDate} onChange={(e) => onEducationChange(education.map((x, i) => i === idx ? { ...x, endDate: e.target.value } : x))} />
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {includedSections.includes('skills') && (
        <Card>
          <CardContent>
            <Collapsible defaultOpen className="group/collapsible">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="group w-full justify-start text-sm font-semibold">
                  {t('skills')}
                  <Badge variant="secondary" className="ml-2 text-xs">{skills.length}</Badge>
                  <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => onSkillsChange([{ id: generateId(), name: '' }, ...skills])}>
                  <Plus className="mr-1 h-3 w-3" />
                  {t('addEntry', { section: t('skills') })}
                </Button>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <div key={`${skill.id}-${idx}`} className={`flex items-center gap-1.5 border rounded-full px-3 py-1 text-sm ${skill.hidden ? 'opacity-50' : getSkillColor(skill.name, keywordMap)}`}>
                      <Checkbox
                        className="h-3.5 w-3.5 shrink-0"
                        checked={!skill.hidden}
                        onCheckedChange={() => toggleSkillHidden(idx)}
                      />
                      <Input
                        value={skill.name}
                        className="border-0 bg-transparent h-6 text-sm p-0 px-3 min-w-8 focus-visible:ring-0"
                        style={{ fieldSizing: 'content' } as React.CSSProperties}
                        onChange={(e) => onSkillsChange(skills.map((s, i) => i === idx ? { ...s, name: e.target.value } : s))}
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Languages */}
      {includedSections.includes('languages') && (
        <Card>
          <CardContent>
            <Collapsible defaultOpen className="group/collapsible">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="group w-full justify-start text-sm font-semibold">
                  {t('languages')}
                  <Badge variant="secondary" className="ml-2 text-xs">{languages.length}</Badge>
                  <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => onLanguagesChange([{ id: generateId(), language: '', proficiency: '' }, ...languages])}>
                  <Plus className="mr-1 h-3 w-3" />
                  {t('addEntry', { section: t('languages') })}
                </Button>
                {languages.map((lang, idx) => (
                  <div key={`${lang.id}-${idx}`} className={`flex items-center gap-2 ${lang.hidden ? 'opacity-50' : ''}`}>
                    <Checkbox
                      checked={!lang.hidden}
                      onCheckedChange={() => toggleLangHidden(idx)}
                    />
                    <Input placeholder={t('language')} value={lang.language} onChange={(e) => onLanguagesChange(languages.map((l, i) => i === idx ? { ...l, language: e.target.value } : l))} />
                    <Input placeholder={t('proficiency')} value={lang.proficiency} onChange={(e) => onLanguagesChange(languages.map((l, i) => i === idx ? { ...l, proficiency: e.target.value } : l))} />
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {includedSections.includes('certifications') && (
        <Card>
          <CardContent>
            <Collapsible defaultOpen className="group/collapsible">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="group w-full justify-start text-sm font-semibold">
                  {t('certifications')}
                  <Badge variant="secondary" className="ml-2 text-xs">{certifications.length}</Badge>
                  <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => onCertificationsChange([{ id: generateId(), name: '', issuer: '', date: '', url: '' }, ...certifications])}>
                  <Plus className="mr-1 h-3 w-3" />
                  {t('addEntry', { section: t('certifications') })}
                </Button>
                {certifications.map((cert, idx) => (
                  <div key={`${cert.id}-${idx}`} className={`flex items-center gap-2 ${cert.hidden ? 'opacity-50' : ''}`}>
                    <Checkbox
                      checked={!cert.hidden}
                      onCheckedChange={() => toggleCertHidden(idx)}
                    />
                    <div className="grid grid-cols-2 gap-2 flex-1">
                      <Input placeholder={t('certName')} value={cert.name} onChange={(e) => onCertificationsChange(certifications.map((c, i) => i === idx ? { ...c, name: e.target.value } : c))} />
                      <Input placeholder={t('issuer')} value={cert.issuer} onChange={(e) => onCertificationsChange(certifications.map((c, i) => i === idx ? { ...c, issuer: e.target.value } : c))} />
                      <Input type="month" placeholder={t('certDate')} value={cert.date} onChange={(e) => onCertificationsChange(certifications.map((c, i) => i === idx ? { ...c, date: e.target.value } : c))} />
                      <Input placeholder={t('certUrl')} value={cert.url} onChange={(e) => onCertificationsChange(certifications.map((c, i) => i === idx ? { ...c, url: e.target.value } : c))} />
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      {includedSections.includes('projects') && (
        <Card>
          <CardContent>
            <Collapsible defaultOpen className="group/collapsible">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="group w-full justify-start text-sm font-semibold">
                  {t('projects')}
                  <Badge variant="secondary" className="ml-2 text-xs">{projects.length}</Badge>
                  <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <Button variant="outline" size="sm" onClick={() => onProjectsChange([{ id: generateId(), name: '', description: '', url: '', bullets: [''] }, ...projects])}>
                  <Plus className="mr-1 h-3 w-3" />
                  {t('addEntry', { section: t('projects') })}
                </Button>
                {projects.map((proj, idx) => (
                  <div key={`${proj.id}-${idx}`} className={`border rounded-lg p-3 space-y-2 ${proj.hidden ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={!proj.hidden}
                        onCheckedChange={() => toggleProjHidden(idx)}
                      />
                      <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder={t('projectName')} value={proj.name} onChange={(e) => onProjectsChange(projects.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))} />
                      <Input placeholder={t('projectUrl')} value={proj.url} onChange={(e) => onProjectsChange(projects.map((p, i) => i === idx ? { ...p, url: e.target.value } : p))} />
                    </div>
                    <Textarea placeholder={t('description')} value={proj.description} rows={2} onChange={(e) => onProjectsChange(projects.map((p, i) => i === idx ? { ...p, description: e.target.value } : p))} />
                    <div className="space-y-1">
                      {proj.bullets.map((b, bIdx) => {
                        const bulletHidden = proj.hiddenBullets?.includes(bIdx) ?? false;
                        return (
                          <div key={bIdx} className={`flex items-center gap-1 ${bulletHidden ? 'opacity-50' : ''}`}>
                            <Checkbox
                              checked={!bulletHidden}
                              onCheckedChange={() => toggleProjBulletHidden(idx, bIdx)}
                            />
                            <BulletIndicator text={b} />
                            <Input value={b} className="text-xs" onChange={(e) => onProjectsChange(projects.map((p, i) => i === idx ? { ...p, bullets: p.bullets.map((bb, bi) => bi === bIdx ? e.target.value : bb) } : p))} />
                          </div>
                        );
                      })}
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => onProjectsChange(projects.map((p, i) => i === idx ? { ...p, bullets: [...p.bullets, ''] } : p))}>
                        <Plus className="mr-1 h-3 w-3" />
                        {t('addBullet')}
                      </Button>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
