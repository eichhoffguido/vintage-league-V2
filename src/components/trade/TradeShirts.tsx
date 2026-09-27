import { useSiteContent } from "@/hooks/useSiteContent";

const SwapIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M17 3l4 4-4 4M21 7H8M7 21l-4-4 4-4M3 17h13" />
  </svg>
);

/**
 * Zwei Trikot-Silhouetten mit verde ⇄-Scheibe — Dekoration für die nero-Köpfe von
 * Tauschbörse und Tausch-Anfragen (Skill cc-design §5 „Shirt silhouette mask“, §5.1).
 * Bilder = dieselben Motive wie der Scambio-Streifen der Startseite (CMS-pflegbar).
 */
const TradeShirts = () => {
  const { swap } = useSiteContent("home");
  const images = [swap.offer.image, swap.search.image];

  return (
    <div aria-hidden className="relative flex items-start justify-between gap-3 sm:justify-start lg:gap-5">
      {images.map((src, i) => (
        <div
          key={src}
          className="shirt-mask grain grain-dark relative aspect-[330/385] w-[46%] overflow-hidden bg-sabbia sm:w-[180px] lg:w-[220px]"
        >
          <img
            src={src}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            style={i === 1 ? { transform: "scale(1.3)", transformOrigin: "50% 30%", objectPosition: "50% 30%" } : undefined}
          />
        </div>
      ))}
      <div className="absolute left-1/2 top-[30%] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-verde text-avorio sm:left-[186px] sm:-translate-x-1/2 lg:left-[230px] lg:h-16 lg:w-16">
        <SwapIcon className="h-6 w-6 lg:h-8 lg:w-8" />
      </div>
    </div>
  );
};

export default TradeShirts;
