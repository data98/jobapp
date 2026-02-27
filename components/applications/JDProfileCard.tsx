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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  RefreshCw,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  Pencil,
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
  const [profile, setProfile] = useState<JDProfile | null>(initialProfile);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(!initialProfile && hasJobDescription);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['requiredSkills', 'preferredSkills'])
  );

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

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const handleUpdate = useCallback(
    async (updates: Partial<JDProfile>) => {
      if (!profile) return;
      try {
        const updated = await updateJDProfile(profile.id, updates);
        setProfile(updated);
      } catch {
        toast.error('Failed to save changes');
      }
    },
    [profile]
  );

  const handleReextract = async () => {
    if (!confirm(t('reextractConfirm'))) return;
    setLoading(true);
    try {
      const updated = await reextractJDProfile(jobApplicationId);
      setProfile(updated);
      toast.success('Job requirements re-extracted');
    } catch {
      toast.error('Failed to re-extract');
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
      toast.error('Failed to analyze job description');
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          {profile.user_edited && (
            <Badge variant="secondary" className="text-xs">
              <Pencil className="h-3 w-3 mr-1" />
              {t('userEdited')}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReextract}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-1 text-xs">{t('reextract')}</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Role Context */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">
              {t('industry')}
            </Label>
            <Input
              value={profile.industry}
              onChange={(e) =>
                handleUpdate({ industry: e.target.value })
              }
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              {t('department')}
            </Label>
            <Input
              value={profile.department_function}
              onChange={(e) =>
                handleUpdate({ department_function: e.target.value })
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
              value={profile.seniority_level}
              onValueChange={(v) =>
                handleUpdate({ seniority_level: v as SeniorityLevel })
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
              value={profile.min_years_experience ?? ''}
              onChange={(e) =>
                handleUpdate({
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
              value={profile.max_years_experience ?? ''}
              onChange={(e) =>
                handleUpdate({
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
        <SkillSection
          label={t('requiredSkills')}
          skills={profile.required_skills}
          variant="destructive"
          expanded={expandedSections.has('requiredSkills')}
          onToggle={() => toggleSection('requiredSkills')}
          onUpdate={(skills) =>
            handleUpdate({ required_skills: skills })
          }
          t={t}
        />

        {/* Preferred Skills */}
        <SkillSection
          label={t('preferredSkills')}
          skills={profile.preferred_skills}
          variant="secondary"
          expanded={expandedSections.has('preferredSkills')}
          onToggle={() => toggleSection('preferredSkills')}
          onUpdate={(skills) =>
            handleUpdate({ preferred_skills: skills })
          }
          t={t}
        />

        <Separator />

        {/* Education */}
        <CollapsibleSection
          label={t('educationRequirements')}
          expanded={expandedSections.has('education')}
          onToggle={() => toggleSection('education')}
        >
          <div className="space-y-2">
            {profile.education_requirements.map(
              (edu: V1EducationRequirement, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <Select
                    value={edu.level}
                    onValueChange={(v) => {
                      const updated = [...profile.education_requirements];
                      updated[idx] = { ...edu, level: v as V1EducationLevel };
                      handleUpdate({ education_requirements: updated });
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
                      const updated = [...profile.education_requirements];
                      updated[idx] = {
                        ...edu,
                        field: e.target.value || null,
                      };
                      handleUpdate({ education_requirements: updated });
                    }}
                    className="h-8 text-sm flex-1"
                  />
                  <Badge variant={edu.importance === 'required' ? 'destructive' : 'secondary'} className="text-xs">
                    {t(edu.importance)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      const updated = profile.education_requirements.filter(
                        (_: V1EducationRequirement, i: number) => i !== idx
                      );
                      handleUpdate({ education_requirements: updated });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            )}
          </div>
        </CollapsibleSection>

        {/* Certifications */}
        <CollapsibleSection
          label={t('certifications')}
          expanded={expandedSections.has('certifications')}
          onToggle={() => toggleSection('certifications')}
        >
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">{t('required')}</Label>
              <TagList
                items={profile.required_certifications}
                onUpdate={(items) =>
                  handleUpdate({ required_certifications: items })
                }
                variant="destructive"
                addLabel={t('addItem')}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('preferred')}</Label>
              <TagList
                items={profile.preferred_certifications}
                onUpdate={(items) =>
                  handleUpdate({ preferred_certifications: items })
                }
                variant="secondary"
                addLabel={t('addItem')}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Key Responsibilities */}
        <CollapsibleSection
          label={t('keyResponsibilities')}
          expanded={expandedSections.has('responsibilities')}
          onToggle={() => toggleSection('responsibilities')}
        >
          <div className="space-y-1">
            {profile.key_responsibilities.map(
              (resp: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={resp}
                    onChange={(e) => {
                      const updated = [...profile.key_responsibilities];
                      updated[idx] = e.target.value;
                      handleUpdate({ key_responsibilities: updated });
                    }}
                    className="h-8 text-sm flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      const updated = profile.key_responsibilities.filter(
                        (_: string, i: number) => i !== idx
                      );
                      handleUpdate({ key_responsibilities: updated });
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() =>
                handleUpdate({
                  key_responsibilities: [
                    ...profile.key_responsibilities,
                    '',
                  ],
                })
              }
            >
              <Plus className="h-3 w-3 mr-1" /> {t('addItem')}
            </Button>
          </div>
        </CollapsibleSection>

        {/* Soft Skills */}
        <CollapsibleSection
          label={t('softSkills')}
          expanded={expandedSections.has('softSkills')}
          onToggle={() => toggleSection('softSkills')}
        >
          <TagList
            items={profile.soft_skills}
            onUpdate={(items) => handleUpdate({ soft_skills: items })}
            variant="outline"
            addLabel={t('addItem')}
          />
        </CollapsibleSection>
      </CardContent>
    </Card>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function CollapsibleSection({
  label,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium w-full text-left hover:text-foreground/80">
        {expanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pl-5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SkillSection({
  label,
  skills,
  variant,
  expanded,
  onToggle,
  onUpdate,
  t,
}: {
  label: string;
  skills: SkillRequirement[];
  variant: 'destructive' | 'secondary';
  expanded: boolean;
  onToggle: () => void;
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
        importance: variant === 'destructive' ? 'required' : 'preferred',
      },
    ]);
  };

  const updateSkill = (id: string, updates: Partial<SkillRequirement>) => {
    onUpdate(
      skills.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  return (
    <CollapsibleSection label={`${label} (${skills.length})`} expanded={expanded} onToggle={onToggle}>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <div key={skill.id} className="flex items-center gap-1">
              <Badge
                variant={variant}
                className="text-xs cursor-default"
              >
                {skill.name || '...'}
                <button
                  className="ml-1 hover:text-foreground"
                  onClick={() => removeSkill(skill.id)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
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
    </CollapsibleSection>
  );
}

function TagList({
  items,
  onUpdate,
  variant,
  addLabel,
}: {
  items: string[];
  onUpdate: (items: string[]) => void;
  variant: 'destructive' | 'secondary' | 'outline';
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
