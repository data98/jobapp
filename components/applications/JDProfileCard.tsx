'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import {
  RefreshCw,
  Plus,
  X,
  Loader2,
  Pencil,
  Briefcase,
  GraduationCap,
  Award,
  ListChecks,
  Users,
} from 'lucide-react';
import {
  analyzeJobDescription,
  getJDProfile,
  updateJDProfile,
  reextractJDProfile,
} from '@/lib/actions/jd-profile';
import type {
  JDProfile,
  SkillRequirement,
  V1EducationRequirement,
  V1SkillCategory,
  SeniorityLevel,
  V1EducationLevel,
} from '@/types';

interface JDProfileCardProps {
  jobApplicationId: string;
  hasJobDescription: boolean;
  initialProfile: JDProfile | null;
}

const SKILL_CATEGORIES: V1SkillCategory[] = [
  'language',
  'framework',
  'tool',
  'platform',
  'methodology',
  'domain',
];

const SENIORITY_LEVELS: SeniorityLevel[] = [
  'intern',
  'junior',
  'mid',
  'senior',
  'lead',
  'principal',
  'manager',
  'director',
  'executive',
];

const EDUCATION_LEVELS: V1EducationLevel[] = [
  'any',
  'high_school',
  'associate',
  'bachelor',
  'master',
  'phd',
];

export function JDProfileCard({
  jobApplicationId,
  hasJobDescription,
  initialProfile,
}: JDProfileCardProps) {
  const t = useTranslations('jdProfile');
  const tc = useTranslations('common');
  const [profile, setProfile] = useState<JDProfile | null>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(!initialProfile && hasJobDescription);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Poll for profile if not yet available
  useEffect(() => {
    if (!polling) return;

    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const fetched = await getJDProfile(jobApplicationId);
        if (fetched) {
          setProfile(fetched);
          setPolling(false);
          clearInterval(interval);
        }
      } catch {
        // ignore polling errors
      }
      if (attempts >= maxAttempts) {
        setPolling(false);
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, jobApplicationId]);

  const handleUpdate = useCallback(
    async (updates: Partial<JDProfile>) => {
      if (!profile) return;
      try {
        const updated = await updateJDProfile(profile.id, updates);
        setProfile(updated);
      } catch {
        toast.error(tc('error'));
      }
    },
    [profile, tc]
  );

  const handleReextract = async () => {
    setLoading(true);
    try {
      const updated = await reextractJDProfile(jobApplicationId);
      setProfile(updated);
      toast.success(t('reextractSuccess'));
    } catch {
      toast.error(tc('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleManualAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeJobDescription(jobApplicationId);
      setProfile(result);
    } catch {
      toast.error(tc('error'));
    } finally {
      setLoading(false);
    }
  };

  // Loading / polling state
  if (polling) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('analyzing')}
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  // No profile and no JD
  if (!profile && !hasJobDescription) {
    return null;
  }

  // No profile but has JD — offer manual trigger
  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {t('notYetExtracted')}
          </p>
          <Button
            size="sm"
            onClick={handleManualAnalyze}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t('reextract')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const yearsText =
    profile.min_years_experience != null && profile.max_years_experience != null
      ? `${profile.min_years_experience}–${profile.max_years_experience} years`
      : profile.min_years_experience != null
        ? `${profile.min_years_experience}+ years`
        : profile.max_years_experience != null
          ? `up to ${profile.max_years_experience} years`
          : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex flex-col items-start gap-2">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          {profile.user_edited && (
            <Badge variant="secondary" className="text-xs">
              <Pencil className="h-3 w-3 mr-1" />
              {t('userEdited')}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 width">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="mt-[-4px]">
                <Pencil className="h-4 w-4" />
                <span className="ml-1 text-xs">{tc('edit')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden" showCloseButton={false}>
              <JDProfileEditForm
                profile={profile}
                onSave={async (updated) => {
                  await handleUpdate(updated);
                  setDialogOpen(false);
                }}
                onCancel={() => setDialogOpen(false)}
                onReextract={handleReextract}
                loading={loading}
                t={t}
                tc={tc}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Role Context */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {profile.industry && (
            <div>
              <span className="text-muted-foreground">{t('industry')}:</span>{' '}
              {profile.industry}
            </div>
          )}
          {profile.department_function && (
            <div>
              <span className="text-muted-foreground">{t('department')}:</span>{' '}
              {profile.department_function}
            </div>
          )}
        </div>

        {/* Experience */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{profile.seniority_level}</span>
          {yearsText && (
            <>
              <span className="text-muted-foreground">·</span>
              <span>{yearsText}</span>
            </>
          )}
        </div>

        <Separator />

        {/* Required Skills */}
        {profile.required_skills.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t('requiredSkills')} ({profile.required_skills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.required_skills.map((skill) => (
                <Badge key={skill.id} variant="default" className="text-xs">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Preferred Skills */}
        {profile.preferred_skills.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t('preferredSkills')} ({profile.preferred_skills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.preferred_skills.map((skill) => (
                <Badge key={skill.id} variant="secondary" className="text-xs">
                  {skill.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {profile.education_requirements.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                {t('educationRequirements')}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.education_requirements.map((edu, idx) => (
                <Badge
                  key={idx}
                  variant={edu.importance === 'required' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {edu.level.replace('_', ' ')}
                  {edu.field ? ` — ${edu.field}` : ''}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {(profile.required_certifications.length > 0 || profile.preferred_certifications.length > 0) && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                {t('certifications')}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.required_certifications.map((cert, idx) => (
                <Badge key={`req-${idx}`} variant="default" className="text-xs">
                  {cert}
                </Badge>
              ))}
              {profile.preferred_certifications.map((cert, idx) => (
                <Badge key={`pref-${idx}`} variant="secondary" className="text-xs">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key Responsibilities */}
        {profile.key_responsibilities.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                {t('keyResponsibilities')}
              </p>
            </div>
            <ul className="text-sm space-y-0.5 pl-4 list-disc text-muted-foreground">
              {profile.key_responsibilities.map((resp, idx) => (
                <li key={idx}>{resp}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Soft Skills */}
        {profile.soft_skills.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                {t('softSkills')}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.soft_skills.map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Edit Form (inside Dialog) ──────────────────────────────────────────────────

function JDProfileEditForm({
  profile,
  onSave,
  onCancel,
  onReextract,
  loading,
  t,
  tc,
}: {
  profile: JDProfile;
  onSave: (updates: Partial<JDProfile>) => Promise<void>;
  onCancel: () => void;
  onReextract: () => Promise<void>;
  loading: boolean;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
}) {
  const [draft, setDraft] = useState<JDProfile>({ ...profile });
  const [saving, setSaving] = useState(false);

  // Keep draft in sync if profile changes externally (e.g. re-extract)
  useEffect(() => {
    setDraft({ ...profile });
  }, [profile]);

  const update = (updates: Partial<JDProfile>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        industry: draft.industry,
        department_function: draft.department_function,
        seniority_level: draft.seniority_level,
        min_years_experience: draft.min_years_experience,
        max_years_experience: draft.max_years_experience,
        required_skills: draft.required_skills,
        preferred_skills: draft.preferred_skills,
        education_requirements: draft.education_requirements,
        required_certifications: draft.required_certifications,
        preferred_certifications: draft.preferred_certifications,
        key_responsibilities: draft.key_responsibilities,
        soft_skills: draft.soft_skills,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Sticky header with title + Save/Cancel */}
      <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 space-y-0">
        <div className="flex items-center gap-2">
          <DialogTitle>{t('editTitle')}</DialogTitle>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {t('reextract')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('reextractConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('reextractConfirm')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onReextract}>
                  {t('reextract')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {tc('cancel')}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {tc('save')}
          </Button>
        </div>
      </DialogHeader>

      {/* Scrollable form body */}
      <div className="overflow-y-auto flex-1 pr-1 space-y-5">
        {/* Role Context */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">
              {t('industry')}
            </Label>
            <Input
              value={draft.industry}
              onChange={(e) => update({ industry: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              {t('department')}
            </Label>
            <Input
              value={draft.department_function}
              onChange={(e) =>
                update({ department_function: e.target.value })
              }
              className="h-8 text-sm"
            />
          </div>
        </div>

        {/* Experience Level */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">
              {t('seniorityLevel')}
            </Label>
            <Select
              value={draft.seniority_level}
              onValueChange={(v) =>
                update({ seniority_level: v as SeniorityLevel })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SENIORITY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              {t('minYears')}
            </Label>
            <Input
              type="number"
              min={0}
              value={draft.min_years_experience ?? ''}
              onChange={(e) =>
                update({
                  min_years_experience: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                })
              }
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              {t('maxYears')}
            </Label>
            <Input
              type="number"
              min={0}
              value={draft.max_years_experience ?? ''}
              onChange={(e) =>
                update({
                  max_years_experience: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                })
              }
              className="h-8 text-sm"
            />
          </div>
        </div>

        <Separator />

        {/* Required Skills */}
        <EditableSkillSection
          label={t('requiredSkills')}
          skills={draft.required_skills}
          variant="default"
          onUpdate={(skills) => update({ required_skills: skills })}
          t={t}
        />

        {/* Preferred Skills */}
        <EditableSkillSection
          label={t('preferredSkills')}
          skills={draft.preferred_skills}
          variant="secondary"
          onUpdate={(skills) => update({ preferred_skills: skills })}
          t={t}
        />

        <Separator />

        {/* Education */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('educationRequirements')}</p>
          {draft.education_requirements.map(
            (edu: V1EducationRequirement, idx: number) => (
              <div key={idx} className="flex items-center flex-wrap gap-2">
                <Select
                  value={edu.level}
                  onValueChange={(v) => {
                    const updated = [...draft.education_requirements];
                    updated[idx] = { ...edu, level: v as V1EducationLevel };
                    update({ education_requirements: updated });
                  }}
                >
                  <SelectTrigger className="h-8 text-sm w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={edu.field ?? ''}
                  placeholder={t('field')}
                  onChange={(e) => {
                    const updated = [...draft.education_requirements];
                    updated[idx] = {
                      ...edu,
                      field: e.target.value || null,
                    };
                    update({ education_requirements: updated });
                  }}
                  className="h-8 min-w-32 text-sm flex-1"
                />
                <Badge
                  variant={edu.importance === 'required' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {t(edu.importance)}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    const updated = draft.education_requirements.filter(
                      (_: V1EducationRequirement, i: number) => i !== idx
                    );
                    update({ education_requirements: updated });
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          )}
        </div>

        {/* Certifications */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('certifications')}</p>
          <div>
            <Label className="text-xs text-muted-foreground">{t('required')}</Label>
            <EditableTagList
              items={draft.required_certifications}
              onUpdate={(items) =>
                update({ required_certifications: items })
              }
              variant="default"
              addLabel={t('addItem')}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{t('preferred')}</Label>
            <EditableTagList
              items={draft.preferred_certifications}
              onUpdate={(items) =>
                update({ preferred_certifications: items })
              }
              variant="secondary"
              addLabel={t('addItem')}
            />
          </div>
        </div>

        <Separator />

        {/* Key Responsibilities */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('keyResponsibilities')}</p>
          {draft.key_responsibilities.map((resp: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={resp}
                onChange={(e) => {
                  const updated = [...draft.key_responsibilities];
                  updated[idx] = e.target.value;
                  update({ key_responsibilities: updated });
                }}
                className="h-8 text-sm flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  const updated = draft.key_responsibilities.filter(
                    (_: string, i: number) => i !== idx
                  );
                  update({ key_responsibilities: updated });
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() =>
              update({
                key_responsibilities: [
                  ...draft.key_responsibilities,
                  '',
                ],
              })
            }
          >
            <Plus className="h-3 w-3 mr-1" /> {t('addItem')}
          </Button>
        </div>

        {/* Soft Skills */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('softSkills')}</p>
          <EditableTagList
            items={draft.soft_skills}
            onUpdate={(items) => update({ soft_skills: items })}
            variant="outline"
            addLabel={t('addItem')}
          />
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function EditableSkillSection({
  label,
  skills,
  variant,
  onUpdate,
  t,
}: {
  label: string;
  skills: SkillRequirement[];
  variant: 'default' | 'secondary';
  onUpdate: (skills: SkillRequirement[]) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const removeSkill = (id: string) => {
    onUpdate(skills.filter((s) => s.id !== id));
  };

  const addSkill = () => {
    onUpdate([
      ...skills,
      {
        id: crypto.randomUUID(),
        name: '',
        category: 'tool' as V1SkillCategory,
        aliases: [],
        context: '',
        importance: variant === 'default' ? 'required' : 'preferred',
      },
    ]);
  };

  const updateSkill = (id: string, updates: Partial<SkillRequirement>) => {
    onUpdate(
      skills.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label} ({skills.length})</p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <Badge
            key={skill.id}
            variant={variant}
            className="text-xs cursor-default"
          >
            {skill.name || '...'}
            <button
              className="ml-1 opacity-70 hover:opacity-100"
              onClick={() => removeSkill(skill.id)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      {/* Inline edit for skills with empty names */}
      {skills
        .filter((s) => !s.name)
        .map((skill) => (
          <div key={skill.id} className="flex items-center gap-2">
            <Input
              autoFocus
              placeholder={t('skillName')}
              className="h-7 text-sm w-40"
              onBlur={(e) => {
                if (e.target.value) {
                  updateSkill(skill.id, { name: e.target.value });
                } else {
                  removeSkill(skill.id);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
            />
            <Select
              value={skill.category}
              onValueChange={(v) =>
                updateSkill(skill.id, {
                  category: v as V1SkillCategory,
                })
              }
            >
              <SelectTrigger className="h-7 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={addSkill}
      >
        <Plus className="h-3 w-3 mr-1" /> {t('addSkill')}
      </Button>
    </div>
  );
}

function EditableTagList({
  items,
  onUpdate,
  variant,
  addLabel,
}: {
  items: string[];
  onUpdate: (items: string[]) => void;
  variant: 'default' | 'secondary' | 'outline';
  addLabel: string;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, idx) => (
          <Badge key={idx} variant={variant} className="text-xs">
            {item}
            <button
              className="ml-1 hover:text-foreground"
              onClick={() => onUpdate(items.filter((_, i) => i !== idx))}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      {adding ? (
        <Input
          autoFocus
          className="h-7 text-sm w-48"
          placeholder="..."
          onBlur={(e) => {
            if (e.target.value) {
              onUpdate([...items, e.target.value]);
            }
            setAdding(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3 mr-1" /> {addLabel}
        </Button>
      )}
    </div>
  );
}
