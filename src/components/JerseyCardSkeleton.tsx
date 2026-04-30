import { Skeleton } from "@/components/ui/skeleton";

export const JerseyCardSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      {/* Image skeleton */}
      <Skeleton className="aspect-square w-full rounded-none" />

      {/* Content skeleton */}
      <div className="p-4">
        {/* Header section */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* League/Year skeleton */}
            <Skeleton className="h-3 w-24 mb-2" />
            {/* Team skeleton */}
            <Skeleton className="h-5 w-32 mb-1" />
            {/* Jersey name skeleton */}
            <Skeleton className="h-3 w-28" />
          </div>
          {/* Badge skeleton */}
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>

        {/* Condition/Price skeleton */}
        <div className="mt-3 flex justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Bottom section skeleton */}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
};
