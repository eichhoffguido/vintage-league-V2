import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Imprint = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold">Impressum</h1>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Information provided according to § 5 TMG</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                [Company Name]<br />
                [Street Address]<br />
                [Postal Code] [City]<br />
                [Country]
              </p>
              <p>
                <strong>Contact Information:</strong><br />
                Email: contact@vintage-league.de<br />
                Phone: [Phone Number]
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Responsible for editorial</h2>
            <p className="text-muted-foreground">
              [Name of Editor]<br />
              [Address]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">VAT ID</h2>
            <p className="text-muted-foreground">
              VAT ID according to § 27a UStG:<br />
              [VAT ID Number]
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Liability for Contents</h2>
            <p className="text-muted-foreground">
              As service providers, we are liable for own content on these pages according to general laws.
              However, service providers are not obligated to monitor external information provided or stored on
              their website. Once the information has been provided, we are not liable for the loss of this
              information or damages caused by misuse of this information. Liability for damages caused by the
              use of defective or missing information is excluded.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Liability for Links</h2>
            <p className="text-muted-foreground">
              Our website contains links to the websites of third parties ("external links"). As the content of
              these websites is not under our control, we cannot accept liability for such external content.
              In general, the provider of the linked websites is liable for their own content. At the time of
              linking, we assessed the legal compliance of the external content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Copyright</h2>
            <p className="text-muted-foreground">
              The content and works on these web pages created by the operators are subject to German copyright law.
              Reproduction, processing, distribution and any kind of exploitation outside the limits of copyright
              require the written consent of the author or creator.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">Disclaimer</h2>
            <p className="text-muted-foreground">
              The information on our website is provided without guarantee and may not be current, complete, or
              accurate. We reserve the right to modify, supplement, or delete content at any time without notice.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Imprint;
