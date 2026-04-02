import { ShieldCheck, Truck, CreditCard, Star } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "100% Verifiziert",
    description: "Jedes Trikot wird auf Echtheit geprüft",
  },
  {
    icon: Truck,
    title: "Sicherer Versand",
    description: "Versicherter Versand weltweit",
  },
  {
    icon: CreditCard,
    title: "Sichere Zahlung",
    description: "Verschlüsselte Transaktionen via Stripe",
  },
  {
    icon: Star,
    title: "Bewertungen",
    description: "Transparentes Bewertungssystem für Verkäufer",
  },
];

const TrustBanner = () => {
  return (
    <section className="border-y border-border bg-secondary/50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-sm font-semibold tracking-wide">
                {feature.title}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBanner;
