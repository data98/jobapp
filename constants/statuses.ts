import { ApplicationStatus } from '@/types';

export const APPLICATION_STATUSES: {
  value: ApplicationStatus;
  translationKey: string;
  color: string;
}[] = [
  { value: 'bookmarked', translationKey: 'statuses.bookmarked', color: 'gray' },
  { value: 'applying', translationKey: 'statuses.applying', color: 'blue' },
  { value: 'applied', translationKey: 'statuses.applied', color: 'indigo' },
  {
    value: 'interviewing',
    translationKey: 'statuses.interviewing',
    color: 'yellow',
  },
  {
    value: 'negotiation',
    translationKey: 'statuses.negotiation',
    color: 'orange',
  },
  { value: 'accepted', translationKey: 'statuses.accepted', color: 'green' },
  { value: 'rejected', translationKey: 'statuses.rejected', color: 'red' },
] as const;
