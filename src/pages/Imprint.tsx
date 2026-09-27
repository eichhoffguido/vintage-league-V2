import LegalPage from "@/components/layout/LegalPage";
import { useLegalContent } from "@/hooks/useSiteContent";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { IMPRINT_LABELS, IMPRINT_REQUIRED } from "@/content/legal";

// Angaben kommen aus dem CMS (site_content legal.imprint), gepflegt unter Admin → CMS → Rechtliches.
const Imprint = () => {
  const { imprint } = useLegalContent();
  const isAdmin = useIsAdmin();
  const missing = IMPRINT_REQUIRED.filter((k) => !imprint[k].trim());
  const address = [imprint.name, imprint.street, imprint.city, imprint.country].filter((v) => v.trim());

  return (
    <LegalPage title="Impressum.">
      {isAdmin && missing.length > 0 && (
        <div className="not-prose border-2 border-rosso bg-card p-4 text-base" role="alert">
          <div className="cap text-[11px] text-rosso">Nur für Admins sichtbar</div>
          <p className="mt-2">
            Im Impressum fehlen Pflichtangaben: <strong>{missing.map((k) => IMPRINT_LABELS[k]).join(", ")}</strong>.
            Bitte im CMS unter „Rechtliches“ ergänzen.
          </p>
        </div>
      )}

      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          {address.map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </p>
        {imprint.register.trim() && <p>{imprint.register}</p>}
        {imprint.vat_id.trim() && <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: {imprint.vat_id}</p>}
      </section>

      <section>
        <h2>Kontakt</h2>
        <p>
          {imprint.email.trim() && <>E-Mail: <a href={`mailto:${imprint.email}`}>{imprint.email}</a></>}
          {imprint.phone.trim() && (
            <>
              <br />
              Telefon: {imprint.phone}
            </>
          )}
        </p>
      </section>

      <section>
        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>{imprint.responsible.trim() ? `${imprint.responsible}, Anschrift wie oben` : "Anschrift wie oben"}</p>
      </section>

      <section>
        <h2>Plattform der EU-Kommission zur Online-Streitbeilegung</h2>
        <p>
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
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
