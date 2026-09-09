import React, { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Announcements from "@/components/Announcements";
import YearlyCalendar from "@/components/YearlyCalendar";
import SEOHead from "@/components/SEOHead";
import CustomHomeSection from "@/components/home/CustomHomeSection";
import CardsGridSection from "@/components/home/CardsGridSection";
import { cmsService, ContentItem } from "@/services/cmsService";
import { typographyToStyle, TypographyStyle } from "@/lib/typography";

type SectionKind = "announcements" | "calendar" | "custom" | "custom_cards";

interface RenderedSection {
  key: string;
  kind: SectionKind;
  order: number;
  meta?: ContentItem;
}

const DEFAULT_ORDER: Record<SectionKind, number> = {
  announcements: 1,
  calendar: 2,
  custom: 99,
  custom_cards: 99,
};

const SectionHeader: React.FC<{ meta?: ContentItem }> = ({ meta }) => {
  if (!meta) return null;
  const m = meta.metadata || {};
  const t: Record<string, TypographyStyle | undefined> = m.typography || {};
  const hasAny = meta.title || m.subtitle || m.eyebrow;
  if (!hasAny) return null;
  return (
    <div className="container mx-auto max-w-5xl px-4 pt-8 pb-4 text-center">
      {m.eyebrow && (
        <span
          style={typographyToStyle(t.eyebrow)}
          className="inline-block text-xs font-semibold tracking-widest uppercase mb-2 opacity-80"
        >
          {m.eyebrow}
        </span>
      )}
      {meta.title && (
        <h2 style={typographyToStyle(t.title)} className="text-3xl md:text-4xl font-bold mb-2">
          {meta.title}
        </h2>
      )}
      {m.subtitle && (
        <p style={typographyToStyle(t.subtitle)} className="text-base md:text-lg text-muted-foreground">
          {m.subtitle}
        </p>
      )}
    </div>
  );
};

const AnnouncementsPage = () => {
  const [newsSections, setNewsSections] = useState<ContentItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const sections = await cmsService.getNewsSections();
        setNewsSections(sections);
      } catch (err) {
        console.error("Failed to load news sections", err);
      }
    };
    load();
    const onUpdate = () => load();
    window.addEventListener("cms-content-updated", onUpdate);
    return () => window.removeEventListener("cms-content-updated", onUpdate);
  }, []);

  const renderList: RenderedSection[] = useMemo(() => {
    const byKind = new Map<SectionKind, ContentItem>();
    const customs: ContentItem[] = [];
    for (const s of newsSections) {
      const kind = (s.metadata?.section_kind || "custom") as SectionKind;
      if (kind === "custom" || kind === "custom_cards") customs.push(s);
      else byKind.set(kind, s);
    }

    const builtIns: RenderedSection[] = (["announcements", "calendar"] as SectionKind[])
      .map((kind) => {
        const meta = byKind.get(kind);
        if (meta && meta.metadata?.visible === false) return null;
        return {
          key: `builtin-${kind}`,
          kind,
          order: meta?.metadata?.order ?? DEFAULT_ORDER[kind],
          meta,
        } as RenderedSection;
      })
      .filter(Boolean) as RenderedSection[];

    const customSections: RenderedSection[] = customs
      .filter((s) => s.metadata?.visible !== false)
      .map((s) => {
        const kind = (s.metadata?.section_kind === "custom_cards" ? "custom_cards" : "custom") as SectionKind;
        return {
          key: `${kind}-${s.id}`,
          kind,
          order: s.metadata?.order ?? DEFAULT_ORDER[kind],
          meta: s,
        };
      });

    return [...builtIns, ...customSections].sort((a, b) => a.order - b.order);
  }, [newsSections]);

  const renderSection = (s: RenderedSection) => {
    switch (s.kind) {
      case "announcements":
        return (
          <section key={s.key} aria-label="Latest announcements" className="mb-12">
            <SectionHeader meta={s.meta} />
            <Announcements />
          </section>
        );
      case "calendar":
        return (
          <section key={s.key} aria-label="Yearly calendar" className="mb-12">
            <SectionHeader meta={s.meta} />
            <YearlyCalendar />
          </section>
        );
      case "custom":
        return s.meta ? (
          <section key={s.key} aria-label={s.meta.title || "Custom section"} className="mb-12">
            <CustomHomeSection section={s.meta} />
          </section>
        ) : null;
      case "custom_cards":
        return s.meta ? (
          <section key={s.key} aria-label={s.meta.title || "Cards section"} className="mb-12">
            <CardsGridSection section={s.meta} />
          </section>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <>
      <SEOHead
        title="News & Updates | Amuse Kenya"
        description="Stay updated with the latest news, upcoming events, and program schedules from Amuse Kenya. View our yearly calendar for holiday camps, daily activities, and special events."
        keywords="Amuse Kenya announcements, camp schedule Nairobi, holiday program calendar, kids activities updates, Karura Forest events"
        canonical="https://amusekenya.co.ke/announcements"
      />
      <div className="min-h-screen bg-gradient-to-b from-forest-50 to-white">
        <Navbar />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-forest-800 mb-4">
                News &amp; Updates
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Keep up with our latest announcements and upcoming events
              </p>
            </div>

            {renderList.map(renderSection)}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AnnouncementsPage;
