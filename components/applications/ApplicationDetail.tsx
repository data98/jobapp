'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  ExternalLink,
  Pencil,
  Trash2,
  FileText,
  MapPin,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { APPLICATION_STATUSES } from '@/constants/statuses';
import {
  updateApplication,
  deleteApplication,
} from '@/lib/actions/applications';
import type { JobApplication, ApplicationStatus } from '@/types';

interface ApplicationDetailProps {
  application: JobApplication;
  atsScore: number | null;
}

export function ApplicationDetail({ application, atsScore }: ApplicationDetailProps) {
  const t = useTranslations('applications');
  const ts = useTranslations('statuses');
  const tc = useTranslations('common');
  const format = useFormatter();
  const router = useRouter();

  const [app, setApp] = useState(application);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editDetailsForm, setEditDetailsForm] = useState({
    job_title: app.job_title,
    company: app.company,
    job_url: app.job_url ?? '',
    location: app.location ?? '',
    salary_range: app.salary_range ?? '',
    job_description: app.job_description ?? '',
    contact_name: app.contact_name ?? '',
    contact_email: app.contact_email ?? '',
    contact_phone: app.contact_phone ?? '',
    contact_linkedin: app.contact_linkedin ?? '',
  });

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    try {
      const updated = await updateApplication(app.id, {
        status: newStatus,
        applied_date:
          newStatus === 'applied' && !app.applied_date
            ? new Date().toISOString()
            : undefined,
      });
      setApp(updated);
      toast.success(t('statusUpdated'));
    } catch {
      toast.error(tc('error'));
    }
  };


  const handleSaveApplicationDetails = async () => {
    if (!editDetailsForm.job_title.trim() || !editDetailsForm.company.trim()) return;
    try {
      const updated = await updateApplication(app.id, {
        job_title: editDetailsForm.job_title.trim(),
        company: editDetailsForm.company.trim(),
        job_url: editDetailsForm.job_url.trim() || null,
        location: editDetailsForm.location.trim() || null,
        salary_range: editDetailsForm.salary_range.trim() || null,
        job_description: editDetailsForm.job_description.trim() || null,
        contact_name: editDetailsForm.contact_name.trim() || null,
        contact_email: editDetailsForm.contact_email.trim() || null,
        contact_phone: editDetailsForm.contact_phone.trim() || null,
        contact_linkedin: editDetailsForm.contact_linkedin.trim() || null,
      });
      setApp(updated);
      setEditingDetails(false);
      toast.success(t('applicationUpdated'));
    } catch {
      toast.error(tc('error'));
    }
  };

  const handleCancelEditDetails = () => {
    setEditDetailsForm({
      job_title: app.job_title,
      company: app.company,
      job_url: app.job_url ?? '',
      location: app.location ?? '',
      salary_range: app.salary_range ?? '',
      job_description: app.job_description ?? '',
      contact_name: app.contact_name ?? '',
      contact_email: app.contact_email ?? '',
      contact_phone: app.contact_phone ?? '',
      contact_linkedin: app.contact_linkedin ?? '',
    });
    setEditingDetails(false);
  };

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await deleteApplication(app.id);
      toast.success(t('applicationDeleted'));
      router.push('/applications');
    } catch {
      toast.error(tc('error'));
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        {/* Quick actions */}
        <div className="flex items-center gap-3">
          <Link href={`/applications/${app.id}/resume`}>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              {t('openResumeEditor')}
            </Button>
          </Link>
          {atsScore != null && (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${atsScore >= 75 ? 'bg-green-100 text-green-800' :
                atsScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  atsScore >= 40 ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                }`}
            >
              ATS {atsScore}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Select value={app.status} onValueChange={(v) => handleStatusChange(v as ApplicationStatus)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {ts(s.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>


      {/* Overview content */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <StatusBadge status={app.status} />
          <span>
            {t('createdOn', {
              date: format.dateTime(new Date(app.created_at), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            })}
          </span>
          {app.salary_range && <span>· {app.salary_range}</span>}
          {app.job_url && (
            <a
              href={app.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center hover:text-foreground"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              {t('jobUrl')}
            </a>
          )}
          {app.location && (
            <p className="inline-flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-3 w-3" />
              {app.location}
            </p>
          )}
          {editingDetails ? (
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancelEditDetails}>
                {tc('cancel')}
              </Button>
              <Button size="sm" onClick={handleSaveApplicationDetails}>{tc('save')}</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setEditingDetails(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              {tc('edit')}
            </Button>
          )}
        </div>

        {editingDetails ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t('editDetails')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('jobTitle')} *</Label>
                    <Input
                      required
                      value={editDetailsForm.job_title}
                      onChange={(e) =>
                        setEditDetailsForm((f) => ({ ...f, job_title: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('company')} *</Label>
                    <Input
                      required
                      value={editDetailsForm.company}
                      onChange={(e) =>
                        setEditDetailsForm((f) => ({ ...f, company: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('jobUrl')}</Label>
                    <Input
                      type="url"
                      value={editDetailsForm.job_url}
                      onChange={(e) =>
                        setEditDetailsForm((f) => ({ ...f, job_url: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('location')}</Label>
                    <Input
                      value={editDetailsForm.location}
                      onChange={(e) =>
                        setEditDetailsForm((f) => ({ ...f, location: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t('salaryRange')}</Label>
                    <Input
                      value={editDetailsForm.salary_range}
                      onChange={(e) =>
                        setEditDetailsForm((f) => ({ ...f, salary_range: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('jobDescription')}</Label>
                  <Textarea
                    rows={8}
                    value={editDetailsForm.job_description}
                    onChange={(e) =>
                      setEditDetailsForm((f) => ({ ...f, job_description: e.target.value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('contactInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t('contactName')}</Label>
                    <Input
                      value={editDetailsForm.contact_name}
                      onChange={(e) =>
                        setEditDetailsForm((f) => ({ ...f, contact_name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('contactPhone')}</Label>
                    <Input
                      value={editDetailsForm.contact_phone}
                      onChange={(e) =>
                        setEditDetailsForm((f) => ({ ...f, contact_phone: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('contactEmail')}</Label>
                    <Input
                      type="email"
                      value={editDetailsForm.contact_email}
                      onChange={(e) =>
                        setEditDetailsForm((f) => ({ ...f, contact_email: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('contactLinkedin')}</Label>
                    <Input
                      type="url"
                      value={editDetailsForm.contact_linkedin}
                      onChange={(e) =>
                        setEditDetailsForm((f) => ({ ...f, contact_linkedin: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>{t('jobDescription')}</CardTitle>
              </CardHeader>
              <CardContent>
                {app.job_description ? (
                  <div className="whitespace-pre-wrap text-sm">{app.job_description}</div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('noDescription')}</p>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>{t('contactInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  {app.contact_name && (
                    <div>
                      <span className="font-medium">{t('contactName')}:</span>{' '}
                      {app.contact_name}
                    </div>
                  )}
                  {app.contact_phone && (
                    <div>
                      <span className="font-medium">{t('contactPhone')}:</span>{' '}
                      {app.contact_phone}
                    </div>
                  )}
                  {app.contact_email && (
                    <div>
                      <span className="font-medium">{t('contactEmail')}:</span>{' '}
                      <a href={`mailto:${app.contact_email}`} className="text-primary hover:underline">
                        {app.contact_email}
                      </a>
                    </div>
                  )}
                  {app.contact_linkedin && (
                    <a href={app.contact_linkedin} target="_blank" rel="noopener noreferrer" className="font-medium inline-flex items-center gap-1 hover:text-foreground">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      <span >{t('contactLinkedin')}</span>
                    </a>
                  )}
                  {!app.contact_name && !app.contact_email && !app.contact_phone && !app.contact_linkedin && (
                    <p className="text-muted-foreground">{t('noNotes')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div >
  );
}
