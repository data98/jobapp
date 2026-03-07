'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { JobPostingStatusBadge } from './JobPostingStatusBadge';
import { JOB_POSTING_STATUSES } from '@/constants/employer-statuses';
import {
  updateJobPosting,
  publishJobPosting,
  pauseJobPosting,
  closeJobPosting,
  deleteJobPosting,
} from '@/lib/actions/employer-jobs';
import { Separator } from '@/components/ui/separator';
import {
  Pencil,
  Trash2,
  MapPin,
  Clock,
  Users,
  Eye,
  Copy,
  Check,
  X,
  Wallet,
} from 'lucide-react';

import { toast } from 'sonner';
import { SetBreadcrumbLabel } from '@/components/shared/SetBreadcrumbLabel';
import type { JobPosting, JobPostingStatus } from '@/types';

interface JobPostingDetailProps {
  posting: JobPosting;
}

interface EditForm {
  title: string;
  description: string;
  location: string;
  location_type: string;
  employment_type: string;
  department: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  show_salary: boolean;
  seniority_level: string;
  closes_at: string;
  allow_external_apply: boolean;
}

function buildFormFromPosting(p: JobPosting): EditForm {
  return {
    title: p.title,
    description: p.description,
    location: p.location ?? '',
    location_type: p.location_type ?? '',
    employment_type: p.employment_type ?? '',
    department: p.department ?? '',
    salary_min: p.salary_min?.toString() ?? '',
    salary_max: p.salary_max?.toString() ?? '',
    salary_currency: p.salary_currency ?? 'USD',
    show_salary: p.show_salary,
    seniority_level: p.seniority_level ?? '',
    closes_at: p.closes_at?.split('T')[0] ?? '',
    allow_external_apply: p.allow_external_apply,
  };
}

function getLocationTypeKey(lt: string) {
  if (lt === 'remote') return 'remote';
  if (lt === 'hybrid') return 'hybrid';
  return 'onsite';
}

function getEmploymentTypeKey(et: string) {
  if (et === 'full-time') return 'fullTime';
  if (et === 'part-time') return 'partTime';
  if (et === 'contract') return 'contract';
  return 'internship';
}

export function JobPostingDetail({ posting: initialPosting }: JobPostingDetailProps) {
  const t = useTranslations('employer.jobs');
  const tStatuses = useTranslations('employer.statuses');
  const tCommon = useTranslations('common');
  const format = useFormatter();
  const router = useRouter();

  const [posting, setPosting] = useState(initialPosting);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>(buildFormFromPosting(initialPosting));
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Status actions ──────────────────────────────────────────────
  async function handleStatusAction(action: string) {
    setActionLoading(action);
    try {
      let updated: JobPosting;
      switch (action) {
        case 'publish':
          updated = await publishJobPosting(posting.id);
          toast.success(t('published'));
          break;
        case 'pause':
          updated = await pauseJobPosting(posting.id);
          toast.success(t('updated'));
          break;
        case 'close':
          updated = await closeJobPosting(posting.id);
          toast.success(t('updated'));
          break;
        default:
          return;
      }
      setPosting(updated);
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStatusChange(newStatus: JobPostingStatus) {
    if (newStatus === 'published') return handleStatusAction('publish');
    if (newStatus === 'paused') return handleStatusAction('pause');
    if (newStatus === 'closed') return handleStatusAction('close');
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteJobPosting(posting.id);
      toast.success(t('updated'));
      router.push('/employer/jobs' as never);
    } catch {
      toast.error(tCommon('error'));
      setDeleting(false);
    }
  }

  // ─── Inline edit ─────────────────────────────────────────────────
  function handleCancelEdit() {
    setForm(buildFormFromPosting(posting));
    setEditing(false);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.description.trim()) return;
    setActionLoading('save');
    try {
      const updated = await updateJobPosting(posting.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim() || undefined,
        location_type: (form.location_type as 'remote' | 'hybrid' | 'onsite') || undefined,
        employment_type: (form.employment_type as 'full-time' | 'part-time' | 'contract' | 'internship') || undefined,
        department: form.department.trim() || undefined,
        salary_min: form.salary_min ? parseInt(form.salary_min) : undefined,
        salary_max: form.salary_max ? parseInt(form.salary_max) : undefined,
        salary_currency: form.salary_currency,
        show_salary: form.show_salary,
        seniority_level: form.seniority_level.trim() || undefined,
        closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : undefined,
        allow_external_apply: form.allow_external_apply,
      });
      setPosting(updated);
      setEditing(false);
      toast.success(t('updated'));
    } catch {
      toast.error(tCommon('error'));
    } finally {
      setActionLoading(null);
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────
  function updateField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function copyPublicUrl() {
    const url = `${window.location.origin}/en/jobs/${posting.slug}`;
    navigator.clipboard.writeText(url);
    toast.success(tCommon('copy'));
  }

  const locationLabel = [
    posting.location,
    posting.location_type ? t(getLocationTypeKey(posting.location_type)) : null,
  ].filter(Boolean).join(' · ');

  const disabled = !!actionLoading;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SetBreadcrumbLabel label={posting.title} />
      {/* Row 1: status badge + stats + date */}
      <div className="flex items-center gap-2 flex-wrap">
        <JobPostingStatusBadge status={posting.status} />
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {posting.applications_count} {t('applicants')}
        </span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          {posting.views_count} {t('views')}
        </span>
        <span className="text-sm text-muted-foreground ml-auto">
          {format.dateTime(new Date(posting.created_at), {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Row 2: actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {posting.status === 'published' && (
          <Button variant="outline" size="sm" onClick={copyPublicUrl}>
            <Copy className="h-4 w-4 mr-1" />
            URL
          </Button>
        )}

        <Select
          value={posting.status}
          onValueChange={(v) => handleStatusChange(v as JobPostingStatus)}
        >
          <SelectTrigger className="w-auto h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {JOB_POSTING_STATUSES
              .filter((s) => s.value !== 'archived')
              .map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {tStatuses(s.value)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          {editing ? (
            <>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:size-auto sm:px-3 sm:py-1"
                onClick={handleCancelEdit}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">{tCommon('cancel')}</span>
              </Button>
              <Button
                size="icon"
                className="h-8 w-8 sm:size-auto sm:px-3 sm:py-1"
                onClick={handleSave}
                disabled={disabled || !form.title.trim() || !form.description.trim()}
              >
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">{tCommon('save')}</span>
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 sm:size-auto sm:px-3 sm:py-1"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">{tCommon('edit')}</span>
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
                <AlertDialogDescription>{tCommon('confirmDelete')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                  {deleting ? tCommon('deleting') : tCommon('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      {editing ? (
        /* ─── EDIT MODE ─── */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column (3/5) — Title + Description */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('description')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">{t('jobTitle')} *</Label>
                  <Input
                    id="edit-title"
                    required
                    placeholder={t('jobTitlePlaceholder')}
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">{t('description')} *</Label>
                  <Textarea
                    id="edit-description"
                    rows={32}
                    required
                    placeholder={t('descriptionPlaceholder')}
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column (2/5) — Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('details')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Section: Location & Role */}
                <p className="text-md font-medium text-muted-foreground">{t('locationAndRole')}</p>
                <div className="space-y-3">
                  <div className="flex gap-3 w-full">
                    <div className="space-y-2 w-full">
                      <Label htmlFor="edit-location">{t('location')}</Label>
                      <Input
                        id="edit-location"
                        placeholder="e.g. Tbilisi, Georgia"
                        value={form.location}
                        onChange={(e) => updateField('location', e.target.value)}
                        disabled={disabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('locationType')}</Label>
                      <Select value={form.location_type} onValueChange={(v) => updateField('location_type', v)} disabled={disabled}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('locationType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="remote">{t('remote')}</SelectItem>
                          <SelectItem value="hybrid">{t('hybrid')}</SelectItem>
                          <SelectItem value="onsite">{t('onsite')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="space-y-2">
                      <Label className="whitespace-nowrap">{t('employmentType')}</Label>
                      <Select value={form.employment_type} onValueChange={(v) => updateField('employment_type', v)} disabled={disabled}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('employmentType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">{t('fullTime')}</SelectItem>
                          <SelectItem value="part-time">{t('partTime')}</SelectItem>
                          <SelectItem value="contract">{t('contract')}</SelectItem>
                          <SelectItem value="internship">{t('internship')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 w-full">
                      <Label htmlFor="edit-department">{t('department')}</Label>
                      <Input
                        id="edit-department"
                        placeholder="e.g. Engineering"
                        value={form.department}
                        onChange={(e) => updateField('department', e.target.value)}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-seniority">{t('seniorityLevel')}</Label>
                    <Input
                      id="edit-seniority"
                      placeholder="e.g. Senior, Mid-Level, Junior"
                      value={form.seniority_level}
                      onChange={(e) => updateField('seniority_level', e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <Separator />

                {/* Section: Compensation */}
                <div className="flex items-center justify-between">
                  <p className="text-md font-medium text-muted-foreground">{t('compensation')}</p>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="edit-showSalary" className="text-xs text-muted-foreground">{t('showSalary')}</Label>
                    <Switch
                      id="edit-showSalary"
                      checked={form.show_salary}
                      onCheckedChange={(v) => updateField('show_salary', v)}
                      disabled={disabled}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-salaryMin">{t('salaryMin')}</Label>
                      <Input
                        id="edit-salaryMin"
                        type="number"
                        placeholder="0"
                        value={form.salary_min}
                        onChange={(e) => updateField('salary_min', e.target.value)}
                        disabled={disabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-salaryMax">{t('salaryMax')}</Label>
                      <Input
                        id="edit-salaryMax"
                        type="number"
                        placeholder="0"
                        value={form.salary_max}
                        onChange={(e) => updateField('salary_max', e.target.value)}
                        disabled={disabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('currency')}</Label>
                      <Select value={form.salary_currency} onValueChange={(v) => updateField('salary_currency', v)} disabled={disabled}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('currency')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="GEL">GEL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Section: Settings */}
                <div className="flex items-center justify-between">
                  <p className="text-md font-medium text-muted-foreground">{t('applicationSettings')}</p>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="edit-allowExternal" className="text-xs text-muted-foreground">{t('allowExternalApply')}</Label>
                    <Switch
                      id="edit-allowExternal"
                      checked={form.allow_external_apply}
                      onCheckedChange={(v) => updateField('allow_external_apply', v)}
                      disabled={disabled}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-closesAt">{t('closingDate')}</Label>
                  <Input
                    id="edit-closesAt"
                    type="date"
                    value={form.closes_at}
                    onChange={(e) => updateField('closes_at', e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ─── VIEW MODE ─── */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column (3/5) — Description */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{t('description')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {posting.description}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right column (2/5) — Details */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('details')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {locationLabel && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{locationLabel}</span>
                  </div>
                )}
                {posting.employment_type && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('employmentType')}</p>
                    <p className="text-sm font-medium">
                      {t(getEmploymentTypeKey(posting.employment_type))}
                    </p>
                  </div>
                )}
                {posting.department && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('department')}</p>
                    <p className="text-sm font-medium">{posting.department}</p>
                  </div>
                )}
                {posting.seniority_level && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('seniorityLevel')}</p>
                    <p className="text-sm font-medium">{posting.seniority_level}</p>
                  </div>
                )}
                {(posting.salary_min || posting.salary_max) && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      {t('salaryRange')}
                      {!posting.show_salary && (
                        <span className="text-[10px] italic ml-1">(hidden)</span>
                      )}
                    </p>
                    <p className="text-sm font-medium">
                      {posting.salary_min?.toLocaleString()}
                      {posting.salary_max ? ` – ${posting.salary_max.toLocaleString()}` : '+'}
                      {' '}{posting.salary_currency}
                    </p>
                  </div>
                )}
                {posting.closes_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t('closingDate')}
                    </p>
                    <p className="text-sm font-medium">
                      {format.dateTime(new Date(posting.closes_at), {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                {posting.published_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('published')}</p>
                    <p className="text-sm">
                      {format.dateTime(new Date(posting.published_at), {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            {((posting.required_skills as unknown[])?.length > 0 || (posting.preferred_skills as unknown[])?.length > 0) && (
              <Card>
                <CardContent className="pt-6 space-y-3">
                  {(posting.required_skills as Array<{ name: string }>)?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">{t('requiredSkills')}</p>
                      <div className="flex flex-wrap gap-1">
                        {(posting.required_skills as Array<{ name: string }>).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(posting.preferred_skills as Array<{ name: string }>)?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">{t('preferredSkills')}</p>
                      <div className="flex flex-wrap gap-1">
                        {(posting.preferred_skills as Array<{ name: string }>).map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {skill.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
