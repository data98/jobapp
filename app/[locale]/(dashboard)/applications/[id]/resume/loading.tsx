import { Skeleton } from '@/components/ui/skeleton';

export default function ResumeViewLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4 pb-3">
        <Skeleton className="h-7 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left panel */}
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>

        {/* Right panel */}
        <div className="w-1/2 hidden lg:block">
          <Skeleton className="h-full rounded-lg" />
        </div>
      </div>

      {/* Bottom bar */}
      <Skeleton className="h-10 mt-2" />
    </div>
  );
}
