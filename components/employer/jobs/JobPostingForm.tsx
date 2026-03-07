'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createJobPosting,
  updateJobPosting,
  type JobPostingInput,
} from '@/lib/actions/employer-jobs';
import type { JobPosting } from '@/types';

interface JobPostingFormProps {
  posting?: JobPosting;
}

export function JobPostingForm({ posting }: JobPostingFormProps) {
  const t = useTranslations('employer.jobs');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const isEdit = !!posting;

  const [title, setTitle] = useState(posting?.title ?? '');
  const [description, setDescription] = useState(posting?.description ?? '');
  const [location, setLocation] = useState(posting?.location ?? '');
  const [locationType, setLocationType] = useState(posting?.location_type ?? '');
  const [employmentType, setEmploymentType] = useState(posting?.employment_type ?? '');
  const [department, setDepartment] = useState(posting?.department ?? '');
  const [salaryMin, setSalaryMin] = useState(posting?.salary_min?.toString() ?? '');
  const [salaryMax, setSalaryMax] = useState(posting?.salary_max?.toString() ?? '');
  const [salaryCurrency, setSalaryCurrency] = useState(posting?.salary_currency ?? 'USD');
  const [showSalary, setShowSalary] = useState(posting?.show_salary ?? false);
  const [seniorityLevel, setSeniorityLevel] = useState(posting?.seniority_level ?? '');
  const [closesAt, setClosesAt] = useState(posting?.closes_at?.split('T')[0] ?? '');
  const [allowExternalApply, setAllowExternalApply] = useState(posting?.allow_external_apply ?? true);

  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  function buildInput(): JobPostingInput {
    return {
      title,
      description,
      location: location || undefined,
      location_type: (locationType as JobPostingInput['location_type']) || undefined,
      employment_type: (employmentType as JobPostingInput['employment_type']) || undefined,
      department: department || undefined,
      salary_min: salaryMin ? parseInt(salaryMin) : undefined,
      salary_max: salaryMax ? parseInt(salaryMax) : undefined,
      salary_currency: salaryCurrency,
      show_salary: showSalary,
      seniority_level: seniorityLevel || undefined,
      closes_at: closesAt ? new Date(closesAt).toISOString() : undefined,
      allow_external_apply: allowExternalApply,
    };
  }

  async function handleSaveDraft() {
    setIsLoading(true);
    try {
      const input = buildInput();
      if (isEdit) {
        await updateJobPosting(posting!.id, input);
        toast.success(t('updated'));
      } else {
        const created = await createJobPosting(input, false);
        toast.success(t('created'));
        router.push(`/employer/jobs/${created.id}` as never);
        return;
      }
      router.refresh();
    } catch (err) {
      toast.error(tCommon('error'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePublish() {
    setIsPublishing(true);
    try {
      const input = buildInput();
      if (isEdit) {
        await updateJobPosting(posting!.id, input);
        // Publish is handled separately via status actions
        toast.success(t('updated'));
      } else {
        const created = await createJobPosting(input, true);
        toast.success(t('published'));
        router.push(`/employer/jobs/${created.id}` as never);
        return;
      }
      router.refresh();
    } catch (err) {
      toast.error(tCommon('error'));
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  }

  const disabled = isLoading || isPublishing;

  return (
    <div className="space-y-6">
      {/* Header: title + actions */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('new')}</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={disabled || !title || !description}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t('saveAsDraft')}
          </Button>
          {(!isEdit || posting?.status === 'draft') && (
            <Button
              onClick={handlePublish}
              disabled={disabled || !title || !description}
            >
              {isPublishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('publish')}
            </Button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column (3/5): Title & Description */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('description')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t('jobTitle')} *</Label>
                <Input
                  id="title"
                  required
                  placeholder={t('jobTitlePlaceholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('description')} *</Label>
                <Textarea
                  id="description"
                  required
                  rows={18}
                  placeholder={t('descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={disabled}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column (2/5): Details */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">{t('details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Section: Location & Role */}
              <p className="text-md font-medium text-muted-foreground">{t('locationAndRole')}</p>
              <div className="space-y-3">
                <div className='flex gap-3 w-full'>
                  <div className="space-y-2 w-full">
                    <Label htmlFor="location">{t('location')}</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Tbilisi, Georgia"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('locationType')}</Label>
                    <Select value={locationType} onValueChange={setLocationType} disabled={disabled}>
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
                <div className='flex gap-3'>
                  <div className="space-y-2">
                    <Label className='whitespace-nowrap'>{t('employmentType')}</Label>
                    <Select value={employmentType} onValueChange={setEmploymentType} disabled={disabled}>
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
                    <Label htmlFor="department">{t('department')}</Label>
                    <Input
                      id="department"
                      placeholder="e.g. Engineering"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seniorityLevel">{t('seniorityLevel')}</Label>
                  <Input
                    id="seniorityLevel"
                    placeholder="e.g. Senior, Mid-Level, Junior"
                    value={seniorityLevel}
                    onChange={(e) => setSeniorityLevel(e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </div>

              <Separator />

              {/* Section: Compensation */}
              <div className="flex items-center justify-between">
                <p className="text-md font-medium text-muted-foreground">{t('compensation')}</p>
                <div className="flex items-center gap-2">
                  <Label htmlFor="showSalary" className="text-xs text-muted-foreground">{t('showSalary')}</Label>
                  <Switch
                    id="showSalary"
                    checked={showSalary}
                    onCheckedChange={setShowSalary}
                    disabled={disabled}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="salaryMin">{t('salaryMin')}</Label>
                    <Input
                      id="salaryMin"
                      type="number"
                      placeholder="0"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryMax">{t('salaryMax')}</Label>
                    <Input
                      id="salaryMax"
                      type="number"
                      placeholder="0"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('currency')}</Label>
                    <Select value={salaryCurrency} onValueChange={setSalaryCurrency} disabled={disabled}>
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
                  <Label htmlFor="allowExternalApply" className="text-xs text-muted-foreground">{t('allowExternalApply')}</Label>
                  <Switch
                    id="allowExternalApply"
                    checked={allowExternalApply}
                    onCheckedChange={setAllowExternalApply}
                    disabled={disabled}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closesAt">{t('closingDate')}</Label>
                <Input
                  id="closesAt"
                  type="date"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                  disabled={disabled}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
