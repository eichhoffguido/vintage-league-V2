import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md bg-muted shimmer-loader", className)}
      {...props}
    />
  );
}

export { Skeleton };
