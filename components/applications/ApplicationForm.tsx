'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Link2, Loader2, ChevronDown, Sparkles } from 'lucide-react';
import { createApplication } from '@/lib/actions/applications';

export function ApplicationForm() {
  const t = useTranslations('applications');
  const tc = useTranslations('common');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [formFilled, setFormFilled] = useState(false);

  const [form, setForm] = useState({
    job_title: '',
    company: '',
    job_description: '',
    job_url: '',
    location: '',
    salary_range: '',
  });

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) return;

    setFetching(true);
    try {
      const res = await fetch('/api/ai/parse-job-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Fetch failed');
      }

      const data = await res.json();

      setForm({
        job_title: data.job_title || '',
        company: data.company || '',
        job_description: data.job_description || '',
        job_url: urlInput.trim(),
        location: data.location || '',
        salary_range: data.salary_range || '',
      });

      setFormFilled(true);
      setManualOpen(true);
      toast.success(t('fetchSuccess'));
    } catch {
      toast.error(t('fetchError'));
      setManualOpen(true);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.job_title.trim() || !form.company.trim()) return;

    setSubmitting(true);
    try {
      const app = await createApplication({
        job_title: form.job_title.trim(),
        company: form.company.trim(),
        job_description: form.job_description.trim() || undefined,
        job_url: form.job_url.trim() || undefined,
        location: form.location.trim() || undefined,
        salary_range: form.salary_range.trim() || undefined,
      });
      toast.success(t('applicationCreated'));
      router.push(`/applications/${app.id}`);
    } catch {
      toast.error(tc('error'));
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 mx-auto">
      {/* URL-first hero section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('urlSection')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('pasteUrl')}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder={t('pasteUrlPlaceholder')}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="pl-9"
                  disabled={fetching}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFetchUrl();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleFetchUrl}
                disabled={fetching || !urlInput.trim()}
              >
                {fetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('fetchingJob')}
                  </>
                ) : (
                  t('fetchAndFill')
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form section — collapsible when not yet filled */}
      <form onSubmit={handleSubmit}>
        {formFilled ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('new')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormFields form={form} setForm={setForm} t={t} />
              <FormActions
                submitting={submitting}
                tc={tc}
                onCancel={() => router.push('/applications')}
              />
            </CardContent>
          </Card>
        ) : (
          <Collapsible open={manualOpen} onOpenChange={setManualOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <span>{t('orEnterManually')}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        manualOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <FormFields form={form} setForm={setForm} t={t} />
                  <FormActions
                    submitting={submitting}
                    tc={tc}
                    onCancel={() => router.push('/applications')}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </form>
    </div>
  );
}

interface FormFieldsProps {
  form: {
    job_title: string;
    company: string;
    job_description: string;
    job_url: string;
    location: string;
    salary_range: string;
  };
  setForm: React.Dispatch<React.SetStateAction<FormFieldsProps['form']>>;
  t: ReturnType<typeof useTranslations<'applications'>>;
}

function FormFields({ form, setForm, t }: FormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('jobTitle')} *</Label>
          <Input
            required
            value={form.job_title}
            onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('company')} *</Label>
          <Input
            required
            value={form.company}
            onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('jobUrl')}</Label>
          <Input
            type="url"
            value={form.job_url}
            onChange={(e) => setForm((f) => ({ ...f, job_url: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('location')}</Label>
          <Input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>{t('salaryRange')}</Label>
          <Input
            value={form.salary_range}
            onChange={(e) => setForm((f) => ({ ...f, salary_range: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t('jobDescription')}</Label>
        <Textarea
          rows={8}
          value={form.job_description}
          onChange={(e) => setForm((f) => ({ ...f, job_description: e.target.value }))}
        />
      </div>
    </>
  );
}

interface FormActionsProps {
  submitting: boolean;
  tc: ReturnType<typeof useTranslations<'common'>>;
  onCancel: () => void;
}

function FormActions({ submitting, tc, onCancel }: FormActionsProps) {
  return (
    <div className="flex gap-3 justify-end pt-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        {tc('cancel')}
      </Button>
      <Button type="submit" disabled={submitting}>
        {submitting ? tc('creating') : tc('create')}
      </Button>
    </div>
  );
}
