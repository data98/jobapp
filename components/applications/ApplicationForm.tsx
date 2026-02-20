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
import { createApplication } from '@/lib/actions/applications';

export function ApplicationForm() {
  const t = useTranslations('applications');
  const tc = useTranslations('common');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    job_title: '',
    company: '',
    job_description: '',
    job_url: '',
    location: '',
    salary_range: '',
  });

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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('new')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('jobTitle')} *</Label>
              <Input
                required
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('company')} *</Label>
              <Input
                required
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('jobUrl')}</Label>
              <Input
                type="url"
                value={form.job_url}
                onChange={(e) => setForm({ ...form, job_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('location')}</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t('salaryRange')}</Label>
              <Input
                value={form.salary_range}
                onChange={(e) => setForm({ ...form, salary_range: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('jobDescription')}</Label>
            <Textarea
              rows={8}
              value={form.job_description}
              onChange={(e) => setForm({ ...form, job_description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/applications')}
            >
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? tc('creating') : tc('create')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
