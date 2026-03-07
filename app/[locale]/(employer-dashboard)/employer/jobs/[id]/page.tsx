import { notFound } from 'next/navigation';
import { getJobPosting } from '@/lib/actions/employer-jobs';
import { JobPostingDetail } from '@/components/employer/jobs/JobPostingDetail';

export default async function JobPostingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const posting = await getJobPosting(id);

  if (!posting) {
    notFound();
  }

  return <JobPostingDetail posting={posting} />;
}
