import type { JobPostingStatus, ExternalApplicationStatus } from '@/types';

export const JOB_POSTING_STATUSES = [
  { value: 'draft' as JobPostingStatus, translationKey: 'employer.statuses.draft', color: 'gray' },
  { value: 'published' as JobPostingStatus, translationKey: 'employer.statuses.published', color: 'green' },
  { value: 'paused' as JobPostingStatus, translationKey: 'employer.statuses.paused', color: 'yellow' },
  { value: 'closed' as JobPostingStatus, translationKey: 'employer.statuses.closed', color: 'red' },
  { value: 'archived' as JobPostingStatus, translationKey: 'employer.statuses.archived', color: 'gray' },
] as const;

export const EXTERNAL_APPLICATION_STATUSES = [
  { value: 'new' as ExternalApplicationStatus, translationKey: 'employer.applicantStatuses.new', color: 'blue' },
  { value: 'reviewed' as ExternalApplicationStatus, translationKey: 'employer.applicantStatuses.reviewed', color: 'gray' },
  { value: 'shortlisted' as ExternalApplicationStatus, translationKey: 'employer.applicantStatuses.shortlisted', color: 'indigo' },
  { value: 'interviewing' as ExternalApplicationStatus, translationKey: 'employer.applicantStatuses.interviewing', color: 'yellow' },
  { value: 'offer' as ExternalApplicationStatus, translationKey: 'employer.applicantStatuses.offer', color: 'orange' },
  { value: 'hired' as ExternalApplicationStatus, translationKey: 'employer.applicantStatuses.hired', color: 'green' },
  { value: 'rejected' as ExternalApplicationStatus, translationKey: 'employer.applicantStatuses.rejected', color: 'red' },
  { value: 'withdrawn' as ExternalApplicationStatus, translationKey: 'employer.applicantStatuses.withdrawn', color: 'gray' },
] as const;
