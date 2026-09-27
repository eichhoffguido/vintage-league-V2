import { Skeleton } from "@/components/ui/skeleton";

/** Platzhalter in Figurina-Form (Skill cc-design §6): Kopfzeile, Bild 4:5, Titel, Meta, Preiszeile. */
export const JerseyCardSkeleton = () => {
  return (
    <div className="flex h-full flex-col gap-2.5 border-2 border-nero bg-card p-2 md:p-3" aria-hidden>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="mt-auto flex items-center justify-between border-t border-nero pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
};
