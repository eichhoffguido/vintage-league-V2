import { Skeleton } from "@/components/ui/skeleton";
import { JerseyCardSkeleton } from "@/components/JerseyCardSkeleton";

/** Ladezustand der Profilseite: verde Kopfband (persönlicher Bereich, Skill cc-design §5.1) + Figurina-Raster. */
export const ProfilePageSkeleton = () => {
  return (
    <div className="min-h-screen bg-background" aria-busy="true">
      <section className="bg-verde">
        <div className="container mx-auto flex items-center gap-6 px-4 py-12 md:px-10 md:py-20">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full bg-avorio/25 md:h-28 md:w-28" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-32 bg-avorio/25" />
            <Skeleton className="h-10 w-2/3 max-w-md bg-avorio/25 md:h-16" />
            <Skeleton className="h-4 w-1/2 max-w-sm bg-avorio/25" />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 md:px-10">
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-2 border-nero bg-card p-6">
              <Skeleton className="mb-3 h-3 w-24" />
              <Skeleton className="h-9 w-16" />
            </div>
          ))}
        </div>

        <Skeleton className="mb-6 h-10 w-56" />
        <div className="grid grid-cols-2 gap-2.5 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <JerseyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};
