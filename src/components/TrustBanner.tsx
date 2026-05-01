import { ShieldCheck, Truck, Award, Lock } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Echtheitszertifikat",
    description: "Jedes Stück wird von Experten geprüft und zertifiziert",
  },
  {
    icon: Award,
    title: "Sammlerstücke",
    description: "Kuratierte Auswahl seltener und historischer Trikots",
  },
  {
    icon: Truck,
    title: "Versicherter Versand",
    description: "Sorgfältig verpackt und weltweit versichert",
  },
  {
    icon: Lock,
    title: "Käuferschutz",
    description: "Geld-zurück-Garantie bei Nicht-Authentizität",
  },
];

const TrustBanner = () => {
  return (
    <section className="grain border-y border-border bg-secondary/30 py-10">
      <div className="container mx-auto px-4">
        {/* Authenticity headline */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-px w-8 bg-primary/40" />
            <span className="font-display text-xs tracking-[0.25em] text-primary">
              AUTHENTIZITÄTSGARANTIE
            </span>
            <div className="h-px w-8 bg-primary/40" />
          </div>
          <p className="font-serif text-lg italic text-muted-foreground">
            Jedes Trikot erzählt eine Geschichte – wir garantieren, dass sie echt ist.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center stagger-item hover:scale-105 transition-transform duration-300"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-sm border border-primary/20 bg-primary/5 transition-all duration-300 group hover:bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary transition-transform duration-300 hover:rotate-12" />
              </div>
              <h3 className="font-display text-sm font-semibold tracking-wider">
                {feature.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBanner;