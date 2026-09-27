import { useSiteContent } from "@/hooks/useSiteContent";

// Authentizitätsgarantie als schwarzer Streifen (Skill cc-design §5 „Nero stripes“).
// Texte aus dem CMS (home.trust.*), Standard in src/content/home.ts.
const TrustBanner = () => {
  const { trust } = useSiteContent("home");
  return (
    <section className="nero-stripe" aria-label="Authentizitätsgarantie">
      <div className="cap flex items-center justify-between gap-6 overflow-hidden border-b border-avorio/35 px-4 py-3.5 text-xs md:px-10">
        <span>
          <span className="text-rosso">{trust.eyebrow}</span> · {trust.label}
        </span>
        {trust.ticker.map((item) => (
          <span key={item} className="hidden items-center gap-6 whitespace-nowrap lg:flex">
            <span aria-hidden>◆</span>
            {item}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4">
        {trust.features.map((feature, index) => (
          <div
            key={feature.title}
            className={`px-4 pb-10 pt-8 md:px-10 md:pb-14 md:pt-11 ${index > 0 ? "md:border-l md:border-avorio/35" : ""} ${index % 2 === 1 ? "border-l border-avorio/35 md:border-l" : ""}`}
          >
            <div className="display hollow text-[44px] leading-[0.8] md:text-[88px]" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </div>
            <h3 className="mt-4 text-sm md:mt-6 md:whitespace-nowrap md:text-[22px]">{feature.title}</h3>
            <p className="mt-2 max-w-[270px] text-[13px] leading-snug text-avorio/80 md:text-base">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustBanner;
