import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Monogram } from "@/components/brand/Logo";
import { categoryToShopUrl } from "@/data/categoryFilters";
import { useLegalContent, useSiteContent } from "@/hooks/useSiteContent";
import { FEATURES } from "@/config/features";

type FooterLink = { label: string; to?: string; href?: string };

// Kategorie-Links nutzen dieselbe Quelle wie die Header-Chips → filtern im Marktplatz wirklich.
// Claim, Instagram und AGB kommen aus dem CMS (footer.claim, site.contact, legal.terms).
const buildColumns = (instagram: { handle: string; url: string }, hasTerms: boolean): { title: string; links: FooterLink[] }[] => [
  {
    title: "Marktplatz",
    links: [
      { label: "Alle Trikots", to: "/shop" },
      { label: "Just Dropped", to: "/shop?sort=newest" },
      { label: "Klassiker", to: categoryToShopUrl("klassiker") },
      { label: "Raritäten", to: categoryToShopUrl("rarities") },
      { label: "Bundesliga", to: categoryToShopUrl("bundesliga") },
      { label: "Nationalteams", to: categoryToShopUrl("nationalteam") },
    ],
  },
  {
    title: "Sammler",
    links: [
      ...(FEATURES.trade
        ? [
            { label: "Tauschbörse", to: "/shop?tradeable=true" },
            { label: "Meine Tausch-Anfragen", to: "/trades" },
          ]
        : []),
      { label: "Meine Sammlung", to: "/collection" },
      { label: "Mein Profil", to: "/profile" },
      { label: "Community", to: "/community" },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "FAQ", to: "/#faq" },
      { label: "Impressum", to: "/imprint" },
      { label: "Datenschutz", to: "/privacy" },
      ...(hasTerms ? [{ label: "AGB", to: "/agb" }] : []),
      ...(instagram.handle ? [{ label: `Instagram ${instagram.handle}`, href: instagram.url }] : []),
    ],
  },
];

const LINK_CLASS = "cap text-xs leading-[2.3] text-avorio hover:underline underline-offset-4";

const Footer = () => {
  const hollowFill = { "--fill": "hsl(var(--verde))" } as CSSProperties;
  const { claim } = useSiteContent("footer");
  const { contact } = useSiteContent("site");
  const { termsHtml } = useLegalContent();
  const columns = buildColumns({ handle: contact.instagramHandle, url: contact.instagramUrl }, termsHtml.trim() !== "");

  return (
    <footer>
      <div className="tricolore" aria-hidden />
      <div className="relative overflow-hidden bg-verde px-4 pb-8 pt-12 text-avorio md:px-10 md:pb-9 md:pt-[72px]">
        {/* Gelber Kreis — Klammer zum Hero (Skill cc-design §5) */}
        <div aria-hidden className="pointer-events-none absolute -right-[90px] -top-[90px] h-[190px] w-[190px] rounded-full bg-giallo md:-right-[140px] md:-top-[200px] md:h-[380px] md:w-[380px]" />

        <div className="container relative mx-auto grid grid-cols-2 gap-x-4 gap-y-8 px-0 md:grid-cols-4 md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Monogram tone="verde" className="h-11 md:h-[58px]" />
            <p className="mt-4 max-w-[260px] text-[15px] leading-snug text-avorio/80 md:text-base">{claim}</p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <div className="cap text-xs text-avorio/55">{column.title}</div>
              <ul className="mt-1">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.to ?? "/"} className={LINK_CLASS}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Wortmarke — ganzes Wort hohl, nie einzelne Buchstaben */}
        <div className="container relative mx-auto px-0">
          <div className="display mt-10 whitespace-nowrap text-[50px] leading-[0.82] tracking-[-0.065em] md:mt-20 md:text-[clamp(96px,10.7vw,154px)] md:leading-[0.8]" aria-label="Calcio Classics">
            <span className="block md:inline">Calcio</span>{" "}
            <span className="hollow block md:inline" style={hollowFill}>Classics</span>
          </div>
          <div className="cap mt-6 flex flex-col gap-2 border-t border-avorio/45 pt-4 text-[10px] text-avorio/75 md:mt-7 md:flex-row md:justify-between md:text-[11px]">
            <span>© {new Date().getFullYear()} · Calcio Classics</span>
            <span>Gehostet in der EU · DSGVO</span>
            {contact.instagramHandle && (
              <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{contact.instagramHandle}</a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
