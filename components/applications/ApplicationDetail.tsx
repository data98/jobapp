'use client';

import { useState } from 'react';
import { useTranslations, useFormatter } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Trash2,
  Brain,
  FileText,
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
}

export function ApplicationDetail({ application }: ApplicationDetailProps) {
  const t = useTranslations('applications');
  const ts = useTranslations('statuses');
  const tc = useTranslations('common');
  const format = useFormatter();
  const router = useRouter();

  const [app, setApp] = useState(application);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    contact_name: app.contact_name ?? '',
    contact_email: app.contact_email ?? '',
    contact_phone: app.contact_phone ?? '',
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

  const handleSaveDetails = async () => {
    try {
      const updated = await updateApplication(app.id, {
        contact_name: editForm.contact_name || null,
        contact_email: editForm.contact_email || null,
        contact_phone: editForm.contact_phone || null,
      });
      setApp(updated);
      setEditing(false);
      toast.success(tc('saved'));
    } catch {
      toast.error(tc('error'));
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Link
            href="/applications"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {tc('back')}
          </Link>
          <h1 className="text-2xl font-semibold">{app.job_title}</h1>
          <p className="text-lg text-muted-foreground">{app.company}</p>
          {app.location && (
            <p className="text-sm text-muted-foreground">{app.location}</p>
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

      {/* Quick actions */}
      <div className="flex gap-3">
        <Link href={`/applications/${app.id}/analysis`}>
          <Button variant="outline">
            <Brain className="mr-2 h-4 w-4" />
            {t('analyze')}
          </Button>
        </Link>
        <Link href={`/applications/${app.id}/resume`}>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            {t('viewResume')}
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
          <TabsTrigger value="contact">{t('contactInfo')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Meta info */}
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
          </div>

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

        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t('contactInfo')}</CardTitle>
              {!editing && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {tc('edit')}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('contactName')}</Label>
                      <Input
                        value={editForm.contact_name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, contact_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('contactEmail')}</Label>
                      <Input
                        type="email"
                        value={editForm.contact_email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, contact_email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('contactPhone')}</Label>
                      <Input
                        value={editForm.contact_phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, contact_phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      {tc('cancel')}
                    </Button>
                    <Button onClick={handleSaveDetails}>{tc('save')}</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {app.contact_name && (
                    <div>
                      <span className="font-medium">{t('contactName')}:</span>{' '}
                      {app.contact_name}
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
                  {app.contact_phone && (
                    <div>
                      <span className="font-medium">{t('contactPhone')}:</span>{' '}
                      {app.contact_phone}
                    </div>
                  )}
                  {!app.contact_name && !app.contact_email && !app.contact_phone && (
                    <p className="text-muted-foreground">{t('noNotes')}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
