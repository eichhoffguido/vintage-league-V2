// Rechtstexte (CC-C2). Standardwerte, bis sie im CMS gepflegt sind (site_content legal.imprint / legal.privacy).
// Der Datenschutztext ist der Stand von /privacy am 28.09.2026 — inhaltlich mit Rechtsträger/S4 prüfen.

export interface ImprintContent {
  name: string;
  street: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  vat_id: string;
  register: string;
  responsible: string;
}

export const IMPRINT_LABELS: Record<keyof ImprintContent, string> = {
  name: "Name / Firma",
  street: "Straße und Hausnummer",
  city: "PLZ und Ort",
  country: "Land",
  email: "E-Mail",
  phone: "Telefon",
  vat_id: "USt-IdNr.",
  register: "Registereintrag (z. B. Amtsgericht, HRB)",
  responsible: "Verantwortlich für den Inhalt (Name)",
};

/** Pflichtfelder — fehlt eines, sehen Admins auf /imprint einen Warnhinweis. */
export const IMPRINT_REQUIRED: (keyof ImprintContent)[] = ["name", "street", "city", "email", "responsible"];

export const IMPRINT_DEFAULT: ImprintContent = {
  name: "",
  street: "",
  city: "",
  country: "Deutschland",
  email: "kontakt@calcioclassics.de",
  phone: "",
  vat_id: "",
  register: "",
  responsible: "",
};

export const PRIVACY_DEFAULT_HTML = `<h2>1. Verantwortlicher für die Datenverarbeitung</h2><p>Für alle Fragen zum Datenschutz, zur Ausübung Ihrer Rechte und für allgemeine Anfragen kontaktieren Sie bitte:</p><p><strong>Calcio Classics</strong><br>E-Mail: kontakt@calcioclassics.de</p><h2>2. Welche Daten wir erfassen</h2><p>Wir erfassen verschiedene Arten von persönlichen Daten, um unseren Dienst bereitzustellen:</p><ul><li><strong>Kontoeinformationen:</strong> E-Mail-Adresse, Benutzername, Passwort-Hash, Profilinformationen</li><li><strong>Authentifizierungsdaten:</strong> OAuth-Token, Session-IDs, Authentifizierungsprotokoll-Daten</li><li><strong>Jersey-Listings:</strong> Beschreibungen, Preise, Bilder, Standort-Informationen</li><li><strong>Transaktionsdaten:</strong> Verkaufs- und Kaufverlauf, Zahlungsinformationen</li><li><strong>Kommunikationsdaten:</strong> Nachrichten, Kommentare, Community-Beiträge</li><li><strong>Nutzungsdaten:</strong> IP-Adresse, Browser-Typ, besuchte Seiten, Verweildauer</li></ul><h2>3. Zu welchem Zweck wir Ihre Daten verarbeiten</h2><p>Wir verarbeiten Ihre Daten für folgende Zwecke:</p><ul><li>Kontoerstellung und -verwaltung</li><li>Bereitstellung der Calcio Classics-Plattform und deren Funktionalität</li><li>Verarbeitung von Transaktionen und Zahlungen</li><li>Kommunikation mit Ihnen (Support, Updates, wichtige Benachrichtigungen)</li><li>Verbesserung unserer Dienste und Benutzerfreundlichkeit</li><li>Sicherheit und Missbrauchsprävention</li><li>Einhaltung gesetzlicher Anforderungen und Verträge</li></ul><h2>4. Rechtsgrundlage für die Datenverarbeitung</h2><p>Die Verarbeitung Ihrer Daten basiert auf:</p><ul><li><strong>Vertragserfüllung:</strong> Verarbeitung zur Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 b DSGVO)</li><li><strong>Berechtigte Interessen:</strong> Zum Schutz vor Missbrauch und zur Verbesserung unserer Dienste (Art. 6 Abs. 1 f DSGVO)</li><li><strong>Gesetzliche Verpflichtungen:</strong> Zur Einhaltung von Gesetzen und Vorschriften (Art. 6 Abs. 1 c DSGVO)</li><li><strong>Ihre Einwilligung:</strong> Für Marketing und optionale Funktionen (Art. 6 Abs. 1 a DSGVO)</li></ul><h2>5. Mit wem wir Ihre Daten teilen</h2><p>Ihre Daten werden möglicherweise mit folgenden Parteien geteilt:</p><ul><li><strong>Supabase:</strong> Unser Backend-Datenbank-Anbieter. Supabase speichert Ihre Daten verschlüsselt auf Servern in der EU.</li><li><strong>Verified Seller/Käufer:</strong> Ihre öffentlichen Profilinformationen sind für andere Nutzer sichtbar</li><li><strong>Zahlungsanbieter:</strong> Zahlungsinformationen werden an Zahlungsabwickler übermittelt (Details im Checkout)</li><li><strong>Service-Provider:</strong> Technische Dienstleister zur Wartung und Sicherheit unserer Plattform</li><li><strong>Behörden:</strong> Falls gesetzlich erforderlich oder zur Durchsetzung unserer Nutzungsbedingungen</li></ul><h2>6. Wie lange wir Ihre Daten speichern</h2><p>Wir speichern Ihre persönlichen Daten nur so lange, wie notwendig:</p><ul><li><strong>Kontoaktiv:</strong> Solange Ihr Konto aktiv ist</li><li><strong>Nach Kontolöschung:</strong> Bis zu 30 Tage (Wiederherstellungszeitraum), dann endgültig gelöscht</li><li><strong>Transaktionsdaten:</strong> Mindestens 7 Jahre für steuerliche und buchhalterische Zwecke</li><li><strong>Sicherheitslogs:</strong> Bis zu 90 Tage für Sicherheits- und Missbrauchsprävention</li></ul><h2>7. Ihre Datenschutzrechte</h2><p>Unter der DSGVO haben Sie folgende Rechte:</p><ul><li><strong>Zugriff:</strong> Recht zu erfahren, welche Daten wir über Sie speichern</li><li><strong>Berichtigung:</strong> Recht zur Korrektur ungenauer Daten</li><li><strong>Löschung:</strong> Recht auf Löschung Ihrer Daten unter bestimmten Bedingungen ("Recht auf Vergessenwerden")</li><li><strong>Einschränkung:</strong> Recht, die Verarbeitung Ihrer Daten einzuschränken</li><li><strong>Datenportabilität:</strong> Recht, Ihre Daten in maschinenlesbarem Format zu erhalten</li><li><strong>Widerspruch:</strong> Recht, der Verarbeitung unter bestimmten Umständen zu widersprechen</li><li><strong>Beschwerde:</strong> Recht, eine Beschwerde bei der Datenschutzbehörde einzureichen</li></ul><p>Um diese Rechte auszuüben, kontaktieren Sie uns unter kontakt@calcioclassics.de</p><h2>8. Cookies und Tracking</h2><p>Wir verwenden Cookies und ähnliche Technologien, um unsere Dienste zu verbessern:</p><ul><li><strong>Notwendige Cookies:</strong> Zur Authentifizierung und Sicherheit</li><li><strong>Analyse-Cookies:</strong> Um zu verstehen, wie Sie unsere Plattform nutzen</li><li><strong>Funktionale Cookies:</strong> Zur Speicherung von Einstellungen</li></ul><p>Sie können Cookies in Ihren Browser-Einstellungen deaktivieren, dies kann jedoch die Funktionalität beeinträchtigen.</p><h2>9. Sicherheit</h2><p>Wir implementieren technische und organisatorische Sicherheitsmaßnahmen zum Schutz Ihrer persönlichen Daten, einschließlich Verschlüsselung in Transit und im Ruhezustand. Allerdings kann keine Sicherheit über das Internet völlig garantiert werden. Wir können die Sicherheit nicht vollständig garantieren.</p><h2>10. Links zu anderen Websites</h2><p>Unsere Plattform kann Links zu externen Websites enthalten. Wir sind nicht verantwortlich für die Datenschutzpraktiken anderer Websites. Bitte lesen Sie die Datenschutzerklärungen dieser Websites, bevor Sie persönliche Daten teilen.</p><h2>11. Änderungen dieser Datenschutzerklärung</h2><p>Wir können diese Datenschutzerklärung jederzeit aktualisieren. Bedeutende Änderungen werden Ihnen per E-Mail mitgeteilt. Ihre fortgesetzte Nutzung der Plattform nach solchen Änderungen bedeutet Ihre Zustimmung zu der aktualisierten Erklärung.</p><h2>12. Kontakt</h2><p>Wenn Sie Fragen zu dieser Datenschutzerklärung oder zu unseren Datenschutzpraktiken haben, kontaktieren Sie uns bitte:</p><p><strong>Datenschutz Kontakt:</strong><br>E-Mail: kontakt@calcioclassics.de</p>`;

/** AGB — leer, bis der Text im CMS gepflegt ist (dann erscheint auch der Footer-Link). */
export const TERMS_DEFAULT_HTML = "";
