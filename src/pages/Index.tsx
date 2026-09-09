import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/hooks/use-toast";
import Navbar from '@/components/Navbar';
import InteractiveHero from '@/components/InteractiveHero';
import Announcements from '@/components/Announcements';
import ProgramsOverview from '@/components/forms/ProgramsOverview';
import YearlyCalendar from '@/components/YearlyCalendar';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import CustomHomeSection from '@/components/home/CustomHomeSection';
import CardsGridSection from '@/components/home/CardsGridSection';
import { loadFromLocalStorage } from '@/services/dataService';
import { loadEvents } from '@/services/calendarService';
import { Button } from '@/components/ui/button';
import { LockKeyhole } from 'lucide-react';
import MaintenanceBanner from '@/components/MaintenanceBanner';
import { cmsService, ContentItem } from '@/services/cmsService';
import { typographyToStyle, TypographyStyle } from '@/lib/typography';

type SectionKind = 'hero' | 'announcements' | 'programs' | 'calendar' | 'testimonials' | 'custom' | 'custom_cards';

interface RenderedSection {
  key: string;
  kind: SectionKind;
  order: number;
  meta?: ContentItem;
}

const DEFAULT_ORDER: Record<SectionKind, number> = {
  hero: 1,
  announcements: 2,
  programs: 3,
  calendar: 4,
  testimonials: 5,
  custom: 99,
  custom_cards: 99,
};

/**
 * Optional CMS-driven header block rendered above a built-in section when the
 * marketer supplied override text (title/subtitle/eyebrow) + typography.
 */
const SectionHeader: React.FC<{ meta?: ContentItem }> = ({ meta }) => {
  if (!meta) return null;
  const m = meta.metadata || {};
  const t: Record<string, TypographyStyle | undefined> = m.typography || {};
  const hasAny = meta.title || m.subtitle || m.eyebrow;
  if (!hasAny) return null;
  return (
    <div className="container mx-auto max-w-5xl px-4 pt-12 pb-4 text-center">
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

const Index = () => {
  const [secretClicks, setSecretClicks] = useState(0);
  const [secretVisible, setSecretVisible] = useState(false);
  const [homeSections, setHomeSections] = useState<ContentItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const data = loadFromLocalStorage();
      console.log('Data loaded on Index page:', data);
      const events = await loadEvents();
      console.log('Calendar events loaded:', events.length);
    };
    fetchData();

    const loadHome = async () => {
      try {
        const sections = await cmsService.getHomeSections();
        setHomeSections(sections);
      } catch (err) {
        console.error('Failed to load home sections', err);
      }
    };
    loadHome();
    const onUpdate = () => loadHome();
    window.addEventListener('cms-content-updated', onUpdate);

    const lazyImages = document.querySelectorAll('.lazy-image');
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.complete) {
              img.classList.add('loaded');
            } else {
              img.onload = () => img.classList.add('loaded');
              img.onerror = () => {
                console.warn('Failed to load image:', img.src);
                img.classList.add('error-loading');
              };
            }
            imageObserver.unobserve(img);
          }
        });
      }, { rootMargin: '100px 0px', threshold: 0.01 });
      lazyImages.forEach(img => imageObserver.observe(img));
      return () => {
        lazyImages.forEach(img => imageObserver.unobserve(img));
        window.removeEventListener('cms-content-updated', onUpdate);
      };
    }
    return () => {
      window.removeEventListener('cms-content-updated', onUpdate);
    };
  }, []);

  // Build render list: start with the 5 built-in sections, override with any
  // CMS entry that matches by section_kind, then append custom sections. A
  // section with metadata.visible === false is dropped.
  const renderList: RenderedSection[] = React.useMemo(() => {
    const byKind = new Map<SectionKind, ContentItem>();
    const customs: ContentItem[] = [];
    for (const s of homeSections) {
      const kind = (s.metadata?.section_kind || 'custom') as SectionKind;
      if (kind === 'custom' || kind === 'custom_cards') customs.push(s);
      else byKind.set(kind, s);
    }

    const builtIns: RenderedSection[] = (['hero', 'announcements', 'programs', 'calendar', 'testimonials'] as SectionKind[])
      .map(kind => {
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
      .filter(s => s.metadata?.visible !== false)
      .map(s => {
        const kind = (s.metadata?.section_kind === 'custom_cards' ? 'custom_cards' : 'custom') as SectionKind;
        return {
          key: `${kind}-${s.id}`,
          kind,
          order: s.metadata?.order ?? DEFAULT_ORDER[kind],
          meta: s,
        };
      });

    return [...builtIns, ...customSections].sort((a, b) => a.order - b.order);
  }, [homeSections]);

  const renderSection = (s: RenderedSection) => {
    switch (s.kind) {
      case 'hero':
        return (
          <section key={s.key} aria-label="Hero section">
            <SectionHeader meta={s.meta} />
            <InteractiveHero />
          </section>
        );
      case 'announcements':
        return (
          <section key={s.key} aria-label="Latest announcements">
            <SectionHeader meta={s.meta} />
            <Announcements />
          </section>
        );
      case 'programs':
        return (
          <div key={s.key} className="bg-forest-50">
            <section id="programs" aria-label="Our programs">
              <SectionHeader meta={s.meta} />
              <ProgramsOverview />
            </section>
          </div>
        );
      case 'calendar':
        return (
          <div key={s.key} className="bg-forest-50">
            <section aria-label="Annual calendar">
              <SectionHeader meta={s.meta} />
              <YearlyCalendar />
            </section>
          </div>
        );
      case 'testimonials':
        return (
          <section key={s.key} aria-label="Customer testimonials">
            <SectionHeader meta={s.meta} />
            <Testimonials />
          </section>
        );
      case 'custom':
        return s.meta ? (
          <section key={s.key} aria-label={s.meta.title || 'Custom section'}>
            <CustomHomeSection section={s.meta} />
          </section>
        ) : null;
      case 'custom_cards':
        return s.meta ? (
          <section key={s.key} aria-label={s.meta.title || 'Cards section'}>
            <CardsGridSection section={s.meta} />
          </section>
        ) : null;
      default:
        return null;
    }
  };

  const handleSecretClick = () => {
    setSecretClicks(prev => {
      const newCount = prev + 1;
      if (newCount === 5) {
        setSecretVisible(true);
        toast({
          title: "Secret Access Unlocked!",
          description: "You've found the admin portal access.",
          duration: 3000,
        });
      }
      return newCount;
    });
  };
  const handleAdminAccess = () => navigate('/admin');

  return (
    <>
      <SEOHead />
      <div className="min-h-screen">
        <header role="banner">
          <Navbar />
        </header>

        <MaintenanceBanner />

        <main role="main">
          {renderList.map(renderSection)}
        </main>

        <footer role="contentinfo">
          <Footer />
        </footer>

        <div
          className="fixed bottom-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-full cursor-pointer opacity-20 hover:opacity-100 transition-opacity"
          onClick={handleSecretClick}
        >
          <LockKeyhole size={20} className="text-gray-500" />
        </div>

        {secretVisible && (
          <div className="fixed bottom-24 right-6 z-10 space-y-2">
            <Button
              variant="outline"
              className="bg-white text-forest-700 border-forest-500 shadow-lg block w-full"
              onClick={handleAdminAccess}
            >
              Admin Access
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default Index;
