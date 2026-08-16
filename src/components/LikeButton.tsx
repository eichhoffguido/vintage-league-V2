import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  liked: boolean;
  count: number;
  pending?: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: "sm" | "md";
  className?: string;
}

export function LikeButton({ liked, count, pending, onClick, size = "sm", className }: LikeButtonProps) {
  // Rendered as a <span role="button"> rather than a real <button> so this
  // can safely sit inside the whole-card <button> on the community feed
  // (nested <button>s are invalid HTML and break event handling).
  return (
    <span
      role="button"
      tabIndex={0}
      aria-disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "Gefällt-mir entfernen" : "Gefällt mir"}
      onClick={(e) => {
        if (pending) return;
        onClick(e);
      }}
      onKeyDown={(e) => {
        if (pending) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(e as unknown as React.MouseEvent);
        }
      }}
      className={cn(
        "flex cursor-pointer items-center gap-1 rounded-sm transition-colors",
        pending && "opacity-60",
        liked ? "text-primary" : "text-muted-foreground hover:text-primary",
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      <Heart className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4", liked && "fill-current")} />
      {count}
    </span>
  );
}
