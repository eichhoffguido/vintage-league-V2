import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useTeamBadge } from "@/utils/teamBadge";

interface FavoriteTeamBadgeProps {
  team: string | null | undefined;
  className?: string;
}

export function FavoriteTeamBadge({ team, className }: FavoriteTeamBadgeProps) {
  const badge = useTeamBadge(team);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [team]);

  if (!team || !badge) return null;

  return (
    <Badge variant="secondary" className={`inline-flex items-center gap-1.5 font-normal ${className ?? ""}`}>
      {badge.kind === "crest" && !imgError ? (
        <img
          src={badge.url}
          alt=""
          className="h-5 w-5 rounded-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : badge.kind === "flag" ? (
        <span aria-hidden="true">{badge.emoji}</span>
      ) : (
        <span aria-hidden="true">⚽</span>
      )}
      {team}
    </Badge>
  );
}
