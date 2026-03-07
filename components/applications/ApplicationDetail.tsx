'use client';

import { useState, useCallback } from 'react';
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

import {
  ExternalLink,
  Pencil,
  Trash2,
  FileText,
  MapPin,
  Calendar,
  StickyNote,
  Wallet,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { APPLICATION_STATUSES } from '@/constants/statuses';
import {
  updateApplication,
  deleteApplication,
} from '@/lib/actions/applications';
import { JDProfileCard } from './JDProfileCard';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import type { JobApplication, ApplicationStatus, JDProfile } from '@/types';

interface ApplicationDetailProps {
  application: JobApplication;
  atsScore: number | null;
  jdProfile?: JDProfile | null;
}

export function ApplicationDetail({ application, atsScore, jdProfile }: ApplicationDetailProps) {
  const t = useTranslations('applications');
  const ts = useTranslations('statuses');
  const tc = useTranslations('common');
  const format = useFormatter();
  const router = useRouter();

  const [app, setApp] = useState(application);
  const [editingDetails, setEditingDetails] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = useCallback(() => {
    if (!app.contact_email) return;
    navigator.clipboard.writeText(app.contact_email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  }, [app.contact_email]);
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
    notes: app.notes ?? '',
  });

  // Track unsaved changes only when in edit mode
  const trackedData = editingDetails ? editDetailsForm : null;
  const { markSaved } = useUnsavedChanges(trackedData);

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
        notes: editDetailsForm.notes.trim() || null,
      });
      setApp(updated);
      setEditingDetails(false);
      markSaved();
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
      notes: app.notes ?? '',
    });
    setEditingDetails(false);
    markSaved();
  };

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteApplication(app.id);
      toast.success(t('applicationDeleted'));
      router.push('/applications');
    } catch {
      toast.error(tc('error'));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="space-y-3">
        {/* Row 1: badges + date */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={app.status} />
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
          <span className="text-sm text-muted-foreground ml-auto">
            {t('createdOn', {
              date: format.dateTime(new Date(app.created_at), {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }),
            })}
          </span>
        </div>

        {/* Row 2: actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/applications/${app.id}/resume`}>
            <Button size="sm">
              <FileText className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t('openResumeEditor')}</span>
              <span className="sm:hidden">{t('resumeShort')}</span>
            </Button>
          </Link>
          <Select value={app.status} onValueChange={(v) => handleStatusChange(v as ApplicationStatus)}>
            <SelectTrigger className="w-auto h-8 text-sm">
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
          <div className="flex items-center gap-2 ml-auto">
            {editingDetails ? (
              <>
                <Button variant="outline" size="icon" className="h-8 w-8 sm:size-auto sm:px-3 sm:py-1" onClick={handleCancelEditDetails}>
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">{tc('cancel')}</span>
                </Button>
                <Button size="icon" className="h-8 w-8 sm:size-auto sm:px-3 sm:py-1" onClick={handleSaveApplicationDetails}>
                  <Check className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">{tc('save')}</span>
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="icon" className="h-8 w-8 sm:size-auto sm:px-3 sm:py-1" onClick={() => setEditingDetails(true)}>
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">{tc('edit')}</span>
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
                  <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('deleteDescription')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                    {deleting ? tc('deleting') : tc('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">

        {editingDetails ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left column (3/5) — Job info + description */}
            <div className="lg:col-span-3 space-y-4">
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
                  </div>
                  <div className="space-y-2">
                    <Label>{t('jobDescription')}</Label>
                    <Textarea
                      rows={12}
                      value={editDetailsForm.job_description}
                      onChange={(e) =>
                        setEditDetailsForm((f) => ({ ...f, job_description: e.target.value }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column (2/5) — Contact + Details + Notes */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('contactInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
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
                      <Label>{t('contactPhone')}</Label>
                      <Input
                        value={editDetailsForm.contact_phone}
                        onChange={(e) =>
                          setEditDetailsForm((f) => ({ ...f, contact_phone: e.target.value }))
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

              <Card>
                <CardHeader>
                  <CardTitle>{t('details')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{t('location')}</Label>
                      <Input
                        value={editDetailsForm.location}
                        onChange={(e) =>
                          setEditDetailsForm((f) => ({ ...f, location: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('salaryRange')}</Label>
                      <Input
                        value={editDetailsForm.salary_range}
                        onChange={(e) =>
                          setEditDetailsForm((f) => ({ ...f, salary_range: e.target.value }))
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
                      <Label>{t('notes')}</Label>
                      <Textarea
                        rows={4}
                        placeholder={t('notesPlaceholder')}
                        value={editDetailsForm.notes}
                        onChange={(e) =>
                          setEditDetailsForm((f) => ({ ...f, notes: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Left column (3/5) — Job Description */}
            <div className="lg:col-span-3 space-y-4">
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
            </div>

            {/* Right column (2/5) — Contact + Details + JD Profile */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('contactInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm flex gap-x-4 flex-wrap">
                    {app.contact_name && (
                      <div>
                        <span className="font-medium text-muted-foreground">{t('contactName')}</span>
                        <p>{app.contact_name}</p>
                      </div>
                    )}
                    {app.contact_phone && (
                      <div>
                        <span className="font-medium text-muted-foreground">{t('contactPhone')}</span>
                        <p>{app.contact_phone}</p>
                      </div>
                    )}
                    {app.contact_linkedin && (
                      <div>
                        <span className="font-medium text-muted-foreground">{t('contactLinkedin')}</span>
                        <p>
                          <a href={app.contact_linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                            LinkedIn
                          </a>
                        </p>
                      </div>
                    )}
                    {app.contact_email && (
                      <div>
                        <span className="font-medium text-muted-foreground">{t('contactEmail')}</span>
                        <button
                          onClick={handleCopyEmail}
                          className="cursor-pointer flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                          title={tc('copy')}
                        >
                          <p className="text-primary">
                            {app.contact_email}
                          </p>
                          {copiedEmail ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                    {!app.contact_name && !app.contact_email && !app.contact_phone && !app.contact_linkedin && (
                      <p className="text-muted-foreground">{t('noNotes')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('details')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className='flex gap-x-6 gap-y-2 flex-wrap'>
                      {app.job_url && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {t('jobUrl')}
                          </a>
                        </div>
                      )}
                      {app.salary_range && (
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span>{app.salary_range}</span>
                        </div>
                      )}
                      {app.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{app.location}</span>
                        </div>
                      )}
                      {app.applied_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {t('appliedOn', {
                              date: format.dateTime(new Date(app.applied_date), {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }),
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                    {(app.location || app.salary_range || app.applied_date || app.job_url) && app.notes && (
                      <hr className="my-2" />
                    )}
                    {app.notes ? (
                      <div className="flex gap-2">
                        <StickyNote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="whitespace-pre-wrap">{app.notes}</p>
                      </div>
                    ) : !app.location && !app.salary_range && !app.applied_date && !app.job_url ? (
                      <p className="text-muted-foreground">{t('noDetails')}</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <JDProfileCard
                jobApplicationId={app.id}
                hasJobDescription={!!app.job_description}
                initialProfile={jdProfile ?? null}
              />
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
