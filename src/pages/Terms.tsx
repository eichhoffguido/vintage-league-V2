import LegalPage from "@/components/layout/LegalPage";
import { useLegalContent } from "@/hooks/useSiteContent";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

// AGB aus dem CMS (site_content legal.terms). Leer, bis der Text feststeht (S4) — dann Hinweis statt Inhalt.
const Terms = () => {
  const { termsHtml, termsUpdatedAt } = useLegalContent();
  const updated = termsUpdatedAt ? new Date(termsUpdatedAt).toLocaleDateString("de-DE") : null;

  return (
    <LegalPage
      title="AGB."
      subline={updated ? <>Allgemeine Geschäftsbedingungen · zuletzt aktualisiert: {updated}</> : "Allgemeine Geschäftsbedingungen"}
    >
      {termsHtml.trim() ? (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(termsHtml) }} />
      ) : (
        <p>Die Allgemeinen Geschäftsbedingungen folgen in Kürze.</p>
      )}
    </LegalPage>
  );
};

export default Terms;
