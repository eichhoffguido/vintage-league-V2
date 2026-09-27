import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/layout/PageHeader";

interface LegalPageProps {
  title: string;
  subline?: ReactNode;
  children: ReactNode;
}

/**
 * Gerüst für Rechtstexte (Impressum, Datenschutz): avorio-Kopf + verde Footer genügen (Skill cc-design §5.1).
 * Fließtext im prose-cc-Stil, Abschnitte durch 1-px-Linien getrennt.
 */
const LegalPage = ({ title, subline, children }: LegalPageProps) => (
  <div className="flex min-h-screen flex-col bg-background">
    <Header />
    <PageHeader tone="avorio" eyebrow="Note legali · Rechtliches" title={title} subline={subline} />
    <main className="flex-1">
      <div className="container mx-auto max-w-3xl px-4 py-10 md:py-16">
        <div className="prose prose-cc max-w-none space-y-8 [&_h2]:mb-4 [&_h2]:mt-0 [&_h2]:text-[21px] md:[&_h2]:text-2xl [&_section+section]:border-t [&_section+section]:border-nero [&_section+section]:pt-8">
          {children}
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default LegalPage;
