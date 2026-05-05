import { Skeleton } from "@/components/ui/skeleton";

export const ProfilePageSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Profile Section */}
        <div className="mb-12 rounded-sm border border-border bg-card p-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-start gap-6">
              {/* Avatar skeleton */}
              <Skeleton className="h-20 w-20 rounded-sm" />
              <div className="flex-1">
                {/* Name skeleton */}
                <Skeleton className="h-9 w-48 mb-2" />
                {/* Bio skeleton */}
                <Skeleton className="h-4 w-64 mb-3" />
                {/* Email skeleton */}
                <Skeleton className="h-4 w-40 mb-6" />
                {/* Progress bar skeleton */}
                <div className="w-full max-w-md">
                  <Skeleton className="h-2 w-full mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
            {/* Button skeleton */}
            <Skeleton className="h-10 w-32 rounded" />
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-sm border border-border bg-card p-6 text-center">
              <Skeleton className="h-4 w-32 mx-auto mb-3" />
              <Skeleton className="h-8 w-24 mx-auto" />
            </div>
          ))}
        </div>

        {/* Collection Header */}
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Jersey Grid Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-sm border border-border bg-card">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Skeleton className="h-3 w-24 mb-2" />
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-6 w-8 rounded-full" />
                </div>
                <div className="mt-3 flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
