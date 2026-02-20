'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save } from 'lucide-react';
import { saveMasterResume } from '@/lib/actions/resume';
import type {
  PersonalInfo,
  ExperienceEntry,
  EducationEntry,
  SkillGroup,
  LanguageEntry,
  CertificationEntry,
  ProjectEntry,
  MasterResume,
} from '@/types';

function generateId(): string {
  return crypto.randomUUID();
}

const emptyPersonalInfo: PersonalInfo = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedIn: '',
  portfolio: '',
  summary: '',
};

interface ResumeFormProps {
  initialData: MasterResume | null;
}

export function ResumeForm({ initialData }: ResumeFormProps) {
  const t = useTranslations('resume');
  const tc = useTranslations('common');
  const [saving, setSaving] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(
    initialData?.personal_info ?? emptyPersonalInfo
  );
  const [experience, setExperience] = useState<ExperienceEntry[]>(
    initialData?.experience ?? []
  );
  const [education, setEducation] = useState<EducationEntry[]>(
    initialData?.education ?? []
  );
  const [skills, setSkills] = useState<SkillGroup[]>(
    initialData?.skills ?? []
  );
  const [languages, setLanguages] = useState<LanguageEntry[]>(
    initialData?.languages ?? []
  );
  const [certifications, setCertifications] = useState<CertificationEntry[]>(
    initialData?.certifications ?? []
  );
  const [projects, setProjects] = useState<ProjectEntry[]>(
    initialData?.projects ?? []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveMasterResume({
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
  }, [personalInfo, experience, education, skills, languages, certifications, projects, t, tc]);

  // --- Experience helpers ---
  const addExperience = () => {
    setExperience((prev) => [
      ...prev,
      {
        id: generateId(),
        company: '',
        title: '',
        startDate: '',
        endDate: '',
        current: false,
        location: '',
        bullets: [''],
      },
    ]);
  };

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: string | boolean | string[]) => {
    setExperience((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const removeExperience = (index: number) => {
    setExperience((prev) => prev.filter((_, i) => i !== index));
  };

  const addBullet = (expIndex: number) => {
    setExperience((prev) =>
      prev.map((e, i) => (i === expIndex ? { ...e, bullets: [...e.bullets, ''] } : e))
    );
  };

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    setExperience((prev) =>
      prev.map((e, i) =>
        i === expIndex
          ? { ...e, bullets: e.bullets.map((b, bi) => (bi === bulletIndex ? value : b)) }
          : e
      )
    );
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    setExperience((prev) =>
      prev.map((e, i) =>
        i === expIndex ? { ...e, bullets: e.bullets.filter((_, bi) => bi !== bulletIndex) } : e
      )
    );
  };

  // --- Education helpers ---
  const addEducation = () => {
    setEducation((prev) => [
      ...prev,
      { id: generateId(), institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' },
    ]);
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
    setEducation((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const removeEducation = (index: number) => {
    setEducation((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Skills helpers ---
  const addSkillGroup = () => {
    setSkills((prev) => [...prev, { id: generateId(), category: '', items: [] }]);
  };

  const updateSkillGroup = (index: number, field: 'category' | 'items', value: string | string[]) => {
    setSkills((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const removeSkillGroup = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Languages helpers ---
  const addLanguage = () => {
    setLanguages((prev) => [...prev, { id: generateId(), language: '', proficiency: '' }]);
  };

  const updateLanguage = (index: number, field: keyof LanguageEntry, value: string) => {
    setLanguages((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const removeLanguage = (index: number) => {
    setLanguages((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Certifications helpers ---
  const addCertification = () => {
    setCertifications((prev) => [
      ...prev,
      { id: generateId(), name: '', issuer: '', date: '', url: '' },
    ]);
  };

  const updateCertification = (index: number, field: keyof CertificationEntry, value: string) => {
    setCertifications((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const removeCertification = (index: number) => {
    setCertifications((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Projects helpers ---
  const addProject = () => {
    setProjects((prev) => [
      ...prev,
      { id: generateId(), name: '', description: '', url: '', bullets: [''] },
    ]);
  };

  const updateProject = (index: number, field: keyof ProjectEntry, value: string | string[]) => {
    setProjects((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const removeProject = (index: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
  };

  const addProjectBullet = (projIndex: number) => {
    setProjects((prev) =>
      prev.map((p, i) => (i === projIndex ? { ...p, bullets: [...p.bullets, ''] } : p))
    );
  };

  const updateProjectBullet = (projIndex: number, bulletIndex: number, value: string) => {
    setProjects((prev) =>
      prev.map((p, i) =>
        i === projIndex
          ? { ...p, bullets: p.bullets.map((b, bi) => (bi === bulletIndex ? value : b)) }
          : p
      )
    );
  };

  const removeProjectBullet = (projIndex: number, bulletIndex: number) => {
    setProjects((prev) =>
      prev.map((p, i) =>
        i === projIndex ? { ...p, bullets: p.bullets.filter((_, bi) => bi !== bulletIndex) } : p
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? tc('saving') : tc('save')}
        </Button>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="personal">{t('personalInfo')}</TabsTrigger>
          <TabsTrigger value="experience">{t('experience')}</TabsTrigger>
          <TabsTrigger value="education">{t('education')}</TabsTrigger>
          <TabsTrigger value="skills">{t('skills')}</TabsTrigger>
          <TabsTrigger value="languages">{t('languages')}</TabsTrigger>
          <TabsTrigger value="certifications">{t('certifications')}</TabsTrigger>
          <TabsTrigger value="projects">{t('projects')}</TabsTrigger>
        </TabsList>

        {/* Personal Info */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>{t('personalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('fullName')}</Label>
                  <Input
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('email')}</Label>
                  <Input
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('phone')}</Label>
                  <Input
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('locationField')}</Label>
                  <Input
                    value={personalInfo.location}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('linkedIn')}</Label>
                  <Input
                    value={personalInfo.linkedIn}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, linkedIn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('portfolio')}</Label>
                  <Input
                    value={personalInfo.portfolio}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('summary')}</Label>
                <Textarea
                  rows={4}
                  value={personalInfo.summary}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience */}
        <TabsContent value="experience">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('experience')}</CardTitle>
              <Button variant="outline" size="sm" onClick={addExperience}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addEntry', { section: t('experience') })}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {experience.map((exp, expIdx) => (
                <div key={exp.id} className="space-y-4 rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{expIdx + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(expIdx)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('companyName')}</Label>
                      <Input
                        value={exp.company}
                        onChange={(e) => updateExperience(expIdx, 'company', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('jobTitleField')}</Label>
                      <Input
                        value={exp.title}
                        onChange={(e) => updateExperience(expIdx, 'title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('startDate')}</Label>
                      <Input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(expIdx, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('endDate')}</Label>
                      <Input
                        type="month"
                        value={exp.endDate}
                        disabled={exp.current}
                        onChange={(e) => updateExperience(expIdx, 'endDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('locationField')}</Label>
                      <Input
                        value={exp.location}
                        onChange={(e) => updateExperience(expIdx, 'location', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <input
                        type="checkbox"
                        id={`current-${exp.id}`}
                        checked={exp.current}
                        onChange={(e) => updateExperience(expIdx, 'current', e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`current-${exp.id}`}>{t('currentRole')}</Label>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>{t('bulletPoints')}</Label>
                    {exp.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex gap-2">
                        <Input
                          value={bullet}
                          onChange={(e) => updateBullet(expIdx, bIdx, e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBullet(expIdx, bIdx)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addBullet(expIdx)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('addBullet')}
                    </Button>
                  </div>
                </div>
              ))}
              {experience.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('addEntry', { section: t('experience') })}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education */}
        <TabsContent value="education">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('education')}</CardTitle>
              <Button variant="outline" size="sm" onClick={addEducation}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addEntry', { section: t('education') })}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {education.map((edu, eduIdx) => (
                <div key={edu.id} className="space-y-4 rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{eduIdx + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEducation(eduIdx)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('institution')}</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => updateEducation(eduIdx, 'institution', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('degree')}</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => updateEducation(eduIdx, 'degree', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('fieldOfStudy')}</Label>
                      <Input
                        value={edu.field}
                        onChange={(e) => updateEducation(eduIdx, 'field', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('gpa')}</Label>
                      <Input
                        value={edu.gpa}
                        onChange={(e) => updateEducation(eduIdx, 'gpa', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('startDate')}</Label>
                      <Input
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(eduIdx, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('endDate')}</Label>
                      <Input
                        type="month"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(eduIdx, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {education.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('addEntry', { section: t('education') })}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('skills')}</CardTitle>
              <Button variant="outline" size="sm" onClick={addSkillGroup}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addEntry', { section: t('skills') })}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {skills.map((group, gIdx) => (
                <div key={group.id} className="space-y-4 rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{gIdx + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkillGroup(gIdx)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('category')}</Label>
                      <Input
                        value={group.category}
                        onChange={(e) => updateSkillGroup(gIdx, 'category', e.target.value)}
                        placeholder="e.g. Programming, Design"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('skillItems')}</Label>
                      <Input
                        value={group.items.join(', ')}
                        onChange={(e) =>
                          updateSkillGroup(
                            gIdx,
                            'items',
                            e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          )
                        }
                        placeholder="Python, TypeScript, React"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {skills.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('addEntry', { section: t('skills') })}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Languages */}
        <TabsContent value="languages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('languages')}</CardTitle>
              <Button variant="outline" size="sm" onClick={addLanguage}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addEntry', { section: t('languages') })}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {languages.map((lang, lIdx) => (
                <div key={lang.id} className="flex gap-4 items-end rounded-lg border p-4">
                  <div className="flex-1 space-y-2">
                    <Label>{t('language')}</Label>
                    <Input
                      value={lang.language}
                      onChange={(e) => updateLanguage(lIdx, 'language', e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>{t('proficiency')}</Label>
                    <Input
                      value={lang.proficiency}
                      onChange={(e) => updateLanguage(lIdx, 'proficiency', e.target.value)}
                      placeholder="e.g. Native, Fluent, Intermediate"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeLanguage(lIdx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {languages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('addEntry', { section: t('languages') })}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications */}
        <TabsContent value="certifications">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('certifications')}</CardTitle>
              <Button variant="outline" size="sm" onClick={addCertification}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addEntry', { section: t('certifications') })}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {certifications.map((cert, cIdx) => (
                <div key={cert.id} className="space-y-4 rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{cIdx + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCertification(cIdx)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('certName')}</Label>
                      <Input
                        value={cert.name}
                        onChange={(e) => updateCertification(cIdx, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('issuer')}</Label>
                      <Input
                        value={cert.issuer}
                        onChange={(e) => updateCertification(cIdx, 'issuer', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('certDate')}</Label>
                      <Input
                        type="month"
                        value={cert.date}
                        onChange={(e) => updateCertification(cIdx, 'date', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('certUrl')}</Label>
                      <Input
                        value={cert.url}
                        onChange={(e) => updateCertification(cIdx, 'url', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {certifications.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('addEntry', { section: t('certifications') })}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('projects')}</CardTitle>
              <Button variant="outline" size="sm" onClick={addProject}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addEntry', { section: t('projects') })}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {projects.map((proj, pIdx) => (
                <div key={proj.id} className="space-y-4 rounded-lg border p-4">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{pIdx + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProject(pIdx)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('projectName')}</Label>
                      <Input
                        value={proj.name}
                        onChange={(e) => updateProject(pIdx, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('projectUrl')}</Label>
                      <Input
                        value={proj.url}
                        onChange={(e) => updateProject(pIdx, 'url', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('description')}</Label>
                    <Textarea
                      value={proj.description}
                      onChange={(e) => updateProject(pIdx, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>{t('bulletPoints')}</Label>
                    {proj.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex gap-2">
                        <Input
                          value={bullet}
                          onChange={(e) => updateProjectBullet(pIdx, bIdx, e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProjectBullet(pIdx, bIdx)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addProjectBullet(pIdx)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('addBullet')}
                    </Button>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('addEntry', { section: t('projects') })}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
