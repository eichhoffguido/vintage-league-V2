import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Imprint = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold">Impressum</h1>

          <div className="space-y-4 text-muted-foreground">
            <p>
              [Firmenname]<br />
              [Straße und Hausnummer]<br />
              [PLZ] [Ort]<br />
              [Land]
            </p>
            <p>
              <strong>Kontakt:</strong><br />
              E-Mail: contact@vintage-league.de<br />
              Telefon: [Telefonnummer]
            </p>
            <p>
              <strong>Vertreten durch:</strong><br />
              [Name des Vertretungsberechtigten]
            </p>
          </div>

          <div className="mt-8 p-6 border border-border rounded-sm bg-secondary/30">
            <p className="text-muted-foreground text-center">Diese Seite wird noch befüllt</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Imprint;
