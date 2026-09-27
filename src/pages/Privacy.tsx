import LegalPage from "@/components/layout/LegalPage";
import { useLegalContent } from "@/hooks/useSiteContent";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

// Text aus dem CMS (site_content legal.privacy, gepflegt im Rich-Text-Editor), Standard in src/content/legal.ts.
const Privacy = () => {
  const { privacyHtml, privacyUpdatedAt } = useLegalContent();
  const updated = privacyUpdatedAt ? new Date(privacyUpdatedAt).toLocaleDateString("de-DE") : null;

  return (
    <LegalPage
      title="Datenschutz."
      subline={updated ? <>Datenschutzerklärung · zuletzt aktualisiert: {updated}</> : "Datenschutzerklärung"}
    >
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(privacyHtml) }} />
    </LegalPage>
  );
};

export default Privacy;
