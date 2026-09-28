import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Headline from "@/components/brand/Headline";

interface AuthShellProps {
  eyebrow: string;
  headline: string;
  /** Unter der Überschrift in der grünen Hälfte (Stichpunkte oder ein Satz) */
  intro?: ReactNode;
  /** Rechte Hälfte auf Avorio: Formular oder Hinweis */
  children: ReactNode;
}

/** Verde-Split (Skill cc-design §5.1) für Login, Registrierung und „Neues Passwort“. */
const AuthShell = ({ eyebrow, headline, intro, children }: AuthShellProps) => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="border-b border-nero lg:grid lg:min-h-[720px] lg:grid-cols-2">
      <section className="relative overflow-hidden bg-verde px-4 py-10 text-avorio md:px-10 md:py-16 lg:flex lg:flex-col lg:justify-between lg:px-16 lg:py-20">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-[84px] h-[190px] w-[190px] rounded-full bg-giallo lg:-bottom-[190px] lg:-right-[150px] lg:top-auto lg:h-[440px] lg:w-[440px]" />
        <div aria-hidden className="pointer-events-none absolute right-8 top-8 hidden h-[110px] w-[110px] rounded-full border-2 border-avorio opacity-55 lg:block" />
        <div className="cap relative text-avorio/75">{eyebrow}</div>
        <h1 className="display relative mt-4 text-[44px] leading-[0.86] md:text-[80px] lg:text-[clamp(56px,5.2vw,80px)]">
          <Headline text={headline} ground="verde" blockLines />
        </h1>
        {intro && <div className="relative mt-6 max-w-sm text-base text-avorio/85 md:mt-8 md:text-lg">{intro}</div>}
      </section>

      <section className="flex items-center px-4 py-10 md:px-10 md:py-16 lg:px-16">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
    <Footer />
  </div>
);

export default AuthShell;
