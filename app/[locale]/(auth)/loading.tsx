import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Skeleton className="h-96 w-full max-w-md rounded-lg" />
    </div>
  );
}
