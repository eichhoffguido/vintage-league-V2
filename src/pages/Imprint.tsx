import LegalPage from "@/components/layout/LegalPage";
import { CONTACT_EMAIL } from "@/config/brand";

// Platzhalter — vor dem Beta-Launch mit den echten Angaben ersetzen.
const OPERATOR_NAME = "VOLLSTÄNDIGER NAME";
const OPERATOR_STREET = "STRASSE HAUSNUMMER";
const OPERATOR_CITY = "PLZ ORT";
const OPERATOR_COUNTRY = "Deutschland";
const OPERATOR_EMAIL = CONTACT_EMAIL;

const Imprint = () => {
  return (
    <LegalPage title="Impressum.">
      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          {OPERATOR_NAME}<br />
          {OPERATOR_STREET}<br />
          {OPERATOR_CITY}<br />
          {OPERATOR_COUNTRY}
        </p>
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          E-Mail: {OPERATOR_EMAIL}
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>
          {OPERATOR_NAME}, Anschrift wie oben
        </p>
      </section>

      <section>
        <h2>Plattform der EU-Kommission zur Online-Streitbeilegung</h2>
        <p>
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
           
          >
            https://ec.europa.eu/consumers/odr
          </a>
          <br />
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>
    </LegalPage>
  );
};

export default Imprint;
