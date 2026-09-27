import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";

/**
 * Hinweisband ganz oben (z. B. „Private Beta — Kaufen läuft im Testmodus.“), im CMS ein-/ausschaltbar
 * (site.announcement). Schmales nero-Band unter der Tricolore-Linie; Link optional (intern oder extern).
 */
const AnnouncementBar = () => {
  const { announcement } = useSiteContent("site");
  if (!announcement.enabled || !announcement.text.trim()) return null;

  const hasLink = announcement.linkLabel.trim() !== "" && announcement.linkUrl.trim() !== "";
  const internal = announcement.linkUrl.startsWith("/");

  return (
    <div className="nero-stripe" role="status">
      <div className="cap container mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[10px] md:px-10 md:text-[11px]">
        <span>{announcement.text}</span>
        {hasLink &&
          (internal ? (
            <Link to={announcement.linkUrl} className="underline underline-offset-4 hover:text-giallo">
              {announcement.linkLabel}
            </Link>
          ) : (
            <a href={announcement.linkUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-giallo">
              {announcement.linkLabel}
            </a>
          ))}
      </div>
    </div>
  );
};

export default AnnouncementBar;
