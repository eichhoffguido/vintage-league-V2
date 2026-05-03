import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold">Datenschutzerklärung</h1>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">1. Introduction</h2>
            <p className="text-muted-foreground">
              We take the protection of your data very seriously. This privacy policy explains what information we
              collect, how we use it, and what rights you have.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">2. Controller</h2>
            <p className="text-muted-foreground">
              The controller responsible for data processing is:
              <br />
              [Company Name]<br />
              [Address]<br />
              Email: contact@vintage-league.de
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">3. Data Collection and Processing</h2>
            <p className="mb-4 text-muted-foreground">
              We collect and process personal data only to the extent necessary to provide our services. This includes:
            </p>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              <li>Account information (email, name, profile data)</li>
              <li>Transaction data (listings, bids, trades)</li>
              <li>Technical data (IP address, browser information, cookies)</li>
              <li>Communication data (messages, support requests)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">4. Legal Basis</h2>
            <p className="text-muted-foreground">
              Our processing of personal data is based on:
            </p>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              <li>Your consent (Art. 6(1)(a) GDPR)</li>
              <li>Performance of a contract (Art. 6(1)(b) GDPR)</li>
              <li>Compliance with legal obligations (Art. 6(1)(c) GDPR)</li>
              <li>Legitimate interests (Art. 6(1)(f) GDPR)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">5. Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not share your personal data with third parties except:
            </p>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              <li>When required by law</li>
              <li>To service providers who assist in operating our platform (e.g., hosting providers)</li>
              <li>With other users as necessary to facilitate trades and communication</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as necessary to provide our services and comply with legal obligations.
              You can request deletion of your account and associated data at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">7. Your Rights</h2>
            <p className="mb-4 text-muted-foreground">You have the following rights under GDPR:</p>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              <li>Right of access to your data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">8. Cookies</h2>
            <p className="text-muted-foreground">
              We use cookies to enhance your experience. You can configure your browser to refuse cookies.
              Some features may not work properly if cookies are disabled.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">9. Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your data against
              unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold">10. Contact</h2>
            <p className="text-muted-foreground">
              If you have questions about this privacy policy or wish to exercise your rights, please contact:
              <br />
              Email: privacy@vintage-league.de
            </p>
          </section>

          <section className="mb-8">
            <p className="text-sm text-muted-foreground italic">
              Last updated: 2026-05-03
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
