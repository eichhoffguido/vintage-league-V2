import * as AccordionPrimitive from "@radix-ui/react-accordion";
import SectionHeader from "@/components/layout/SectionHeader";
import type { HomeContent } from "@/content/home";

/** FAQ zweispaltig: Kopf links, Akkordeon rechts mit „+ / −“ (Skill cc-design §6). Anker #faq bleibt. */
const FaqSection = ({ content }: { content: HomeContent["faq"] }) => (
  <section id="faq" className="container mx-auto scroll-mt-28 px-4 pb-12 pt-14 md:px-10 md:pb-28 md:pt-[104px] lg:grid lg:grid-cols-[480px_1fr] lg:gap-20">
    <SectionHeader eyebrow={content.eyebrow} headline={content.headline} subline={content.text} size="md" className="md:flex-col md:items-start" />
    <AccordionPrimitive.Root type="single" collapsible defaultValue="item-0" className="mt-5 border-b border-nero lg:mt-0">
      {content.items.map((item, i) => (
        <AccordionPrimitive.Item key={item.question} value={`item-${i}`} className="group border-t border-nero">
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="flex w-full items-start justify-between gap-6 py-4 text-left md:py-[22px]">
              <span className="font-display text-base font-semibold leading-tight tracking-[-0.02em] md:text-[21px]">{item.question}</span>
              <span className="font-display text-xl leading-none md:text-[26px]" aria-hidden>
                <span className="group-data-[state=open]:hidden">+</span>
                <span className="hidden group-data-[state=open]:inline">−</span>
              </span>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <p className="max-w-[620px] pb-5 text-sm leading-[1.45] text-muted-foreground md:pb-6 md:text-[17px]">{item.answer}</p>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  </section>
);

export default FaqSection;
