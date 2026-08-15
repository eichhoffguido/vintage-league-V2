import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Platzhalter — vor dem Beta-Launch mit den echten Angaben ersetzen.
const OPERATOR_NAME = "VOLLSTÄNDIGER NAME";
const OPERATOR_STREET = "STRASSE HAUSNUMMER";
const OPERATOR_CITY = "PLZ ORT";
const OPERATOR_COUNTRY = "Deutschland";
const OPERATOR_EMAIL = "contact@vintage-league.de";

const Imprint = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold">Impressum</h1>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Angaben gemäß § 5 DDG</h2>
              <p className="text-muted-foreground">
                {OPERATOR_NAME}<br />
                {OPERATOR_STREET}<br />
                {OPERATOR_CITY}<br />
                {OPERATOR_COUNTRY}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Kontakt</h2>
              <p className="text-muted-foreground">
                E-Mail: {OPERATOR_EMAIL}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
              <p className="text-muted-foreground">
                {OPERATOR_NAME}, Anschrift wie oben
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Plattform der EU-Kommission zur Online-Streitbeilegung</h2>
              <p className="text-muted-foreground">
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/90"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
                <br />
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Imprint;
