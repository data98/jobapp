import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getJobPostings } from '@/lib/actions/employer-jobs';
import { JobPostingCard } from '@/components/employer/jobs/JobPostingCard';
import { JobPostingListFilter } from '@/components/employer/jobs/JobPostingListFilter';

export default async function JobPostingsPage() {
  const t = await getTranslations('employer.jobs');
  const postings = await getJobPostings();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button asChild>
          <Link href="/employer/jobs/new">
            <Plus className="h-4 w-4 mr-2" />
            {t('new')}
          </Link>
        </Button>
      </div>

      <JobPostingListFilter postings={postings} />
    </div>
  );
}
