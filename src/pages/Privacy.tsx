import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="mb-8 text-4xl font-bold">Datenschutzerklärung</h1>
          <p className="text-sm text-muted-foreground mb-8">Zuletzt aktualisiert: {new Date().toLocaleDateString("de-DE")}</p>

          <div className="space-y-8">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Verantwortlicher für die Datenverarbeitung</h2>
              <p className="text-muted-foreground mb-2">
                Für alle Fragen zum Datenschutz, zur Ausübung Ihrer Rechte und für allgemeine Anfragen kontaktieren Sie bitte:
              </p>
              <p className="text-muted-foreground">
                <strong>VintageLeague</strong><br />
                E-Mail: contact@vintage-league.de
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Welche Daten wir erfassen</h2>
              <p className="text-muted-foreground mb-4">Wir erfassen verschiedene Arten von persönlichen Daten, um unseren Dienst bereitzustellen:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Kontoeinformationen:</strong> E-Mail-Adresse, Benutzername, Passwort-Hash, Profilinformationen</li>
                <li><strong>Authentifizierungsdaten:</strong> OAuth-Token, Session-IDs, Authentifizierungsprotokoll-Daten</li>
                <li><strong>Jersey-Listings:</strong> Beschreibungen, Preise, Bilder, Standort-Informationen</li>
                <li><strong>Transaktionsdaten:</strong> Verkaufs- und Kaufverlauf, Zahlungsinformationen</li>
                <li><strong>Kommunikationsdaten:</strong> Nachrichten, Kommentare, Community-Beiträge</li>
                <li><strong>Nutzungsdaten:</strong> IP-Adresse, Browser-Typ, besuchte Seiten, Verweildauer</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Zu welchem Zweck wir Ihre Daten verarbeiten</h2>
              <p className="text-muted-foreground mb-4">Wir verarbeiten Ihre Daten für folgende Zwecke:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Kontoerstellung und -verwaltung</li>
                <li>Bereitstellung der VintageLeague-Plattform und deren Funktionalität</li>
                <li>Verarbeitung von Transaktionen und Zahlungen</li>
                <li>Kommunikation mit Ihnen (Support, Updates, wichtige Benachrichtigungen)</li>
                <li>Verbesserung unserer Dienste und Benutzerfreundlichkeit</li>
                <li>Sicherheit und Missbrauchsprävention</li>
                <li>Einhaltung gesetzlicher Anforderungen und Verträge</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Rechtsgrundlage für die Datenverarbeitung</h2>
              <p className="text-muted-foreground mb-4">Die Verarbeitung Ihrer Daten basiert auf:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Vertragserfüllung:</strong> Verarbeitung zur Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 b DSGVO)</li>
                <li><strong>Berechtigte Interessen:</strong> Zum Schutz vor Missbrauch und zur Verbesserung unserer Dienste (Art. 6 Abs. 1 f DSGVO)</li>
                <li><strong>Gesetzliche Verpflichtungen:</strong> Zur Einhaltung von Gesetzen und Vorschriften (Art. 6 Abs. 1 c DSGVO)</li>
                <li><strong>Ihre Einwilligung:</strong> Für Marketing und optionale Funktionen (Art. 6 Abs. 1 a DSGVO)</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Mit wem wir Ihre Daten teilen</h2>
              <p className="text-muted-foreground mb-4">Ihre Daten werden möglicherweise mit folgenden Parteien geteilt:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Supabase:</strong> Unser Backend-Datenbank-Anbieter. Supabase speichert Ihre Daten verschlüsselt auf Servern in der EU.</li>
                <li><strong>Verified Seller/Käufer:</strong> Ihre öffentlichen Profilinformationen sind für andere Nutzer sichtbar</li>
                <li><strong>Zahlungsanbieter:</strong> Zahlungsinformationen werden an Zahlungsabwickler übermittelt (Details im Checkout)</li>
                <li><strong>Service-Provider:</strong> Technische Dienstleister zur Wartung und Sicherheit unserer Plattform</li>
                <li><strong>Behörden:</strong> Falls gesetzlich erforderlich oder zur Durchsetzung unserer Nutzungsbedingungen</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Wie lange wir Ihre Daten speichern</h2>
              <p className="text-muted-foreground mb-4">Wir speichern Ihre persönlichen Daten nur so lange, wie notwendig:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Kontoaktiv:</strong> Solange Ihr Konto aktiv ist</li>
                <li><strong>Nach Kontolöschung:</strong> Bis zu 30 Tage (Wiederherstellungszeitraum), dann endgültig gelöscht</li>
                <li><strong>Transaktionsdaten:</strong> Mindestens 7 Jahre für steuerliche und buchhalterische Zwecke</li>
                <li><strong>Sicherheitslogs:</strong> Bis zu 90 Tage für Sicherheits- und Missbrauchsprävention</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Ihre Datenschutzrechte</h2>
              <p className="text-muted-foreground mb-4">Unter der DSGVO haben Sie folgende Rechte:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Zugriff:</strong> Recht zu erfahren, welche Daten wir über Sie speichern</li>
                <li><strong>Berichtigung:</strong> Recht zur Korrektur ungenauer Daten</li>
                <li><strong>Löschung:</strong> Recht auf Löschung Ihrer Daten unter bestimmten Bedingungen ("Recht auf Vergessenwerden")</li>
                <li><strong>Einschränkung:</strong> Recht, die Verarbeitung Ihrer Daten einzuschränken</li>
                <li><strong>Datenportabilität:</strong> Recht, Ihre Daten in maschinenlesbarem Format zu erhalten</li>
                <li><strong>Widerspruch:</strong> Recht, der Verarbeitung unter bestimmten Umständen zu widersprechen</li>
                <li><strong>Beschwerde:</strong> Recht, eine Beschwerde bei der Datenschutzbehörde einzureichen</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Um diese Rechte auszuüben, kontaktieren Sie uns unter contact@vintage-league.de
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cookies und Tracking</h2>
              <p className="text-muted-foreground mb-4">
                Wir verwenden Cookies und ähnliche Technologien, um unsere Dienste zu verbessern:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Notwendige Cookies:</strong> Zur Authentifizierung und Sicherheit</li>
                <li><strong>Analyse-Cookies:</strong> Um zu verstehen, wie Sie unsere Plattform nutzen</li>
                <li><strong>Funktionale Cookies:</strong> Zur Speicherung von Einstellungen</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Sie können Cookies in Ihren Browser-Einstellungen deaktivieren, dies kann jedoch die Funktionalität beeinträchtigen.
              </p>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Sicherheit</h2>
              <p className="text-muted-foreground">
                Wir implementieren technische und organisatorische Sicherheitsmaßnahmen zum Schutz Ihrer persönlichen Daten, einschließlich Verschlüsselung in Transit und im Ruhezustand.
                Allerdings kann keine Sicherheit über das Internet völlig garantiert werden. Wir können die Sicherheit nicht vollständig garantieren.
              </p>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Links zu anderen Websites</h2>
              <p className="text-muted-foreground">
                Unsere Plattform kann Links zu externen Websites enthalten. Wir sind nicht verantwortlich für die Datenschutzpraktiken anderer Websites.
                Bitte lesen Sie die Datenschutzerklärungen dieser Websites, bevor Sie persönliche Daten teilen.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Änderungen dieser Datenschutzerklärung</h2>
              <p className="text-muted-foreground">
                Wir können diese Datenschutzerklärung jederzeit aktualisieren. Bedeutende Änderungen werden Ihnen per E-Mail mitgeteilt.
                Ihre fortgesetzte Nutzung der Plattform nach solchen Änderungen bedeutet Ihre Zustimmung zu der aktualisierten Erklärung.
              </p>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Kontakt</h2>
              <p className="text-muted-foreground mb-4">
                Wenn Sie Fragen zu dieser Datenschutzerklärung oder zu unseren Datenschutzpraktiken haben, kontaktieren Sie uns bitte:
              </p>
              <p className="text-muted-foreground">
                <strong>Datenschutz Kontakt:</strong><br />
                E-Mail: contact@vintage-league.de
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
