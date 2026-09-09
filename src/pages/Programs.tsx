import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

import CustomHomeSection from '@/components/home/CustomHomeSection';
import CardsGridSection from '@/components/home/CardsGridSection';
import { cmsService, ContentItem } from '@/services/cmsService';

/**
 * Public "Programs" overview page. Content is fully CMS-driven via the
 * `about_section` content_type with `metadata.scope = 'programs'` — mirrors
 * the Camp / Home CMS pattern. Marketers add Custom sections and Cards grids
 * (linking to the individual programme pages and registration forms) from the
 * CMS. When no sections exist, a short "being prepared" message is shown.
 */
const Programs: React.FC = () => {
  const [sections, setSections] = useState<ContentItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const rows = await cmsService.getProgramsPageSections();
        setSections(rows);
      } catch (err) {
        console.error('Failed to load programs page sections', err);
      } finally {
        setLoaded(true);
      }
    };
    load();
    const onUpdate = () => load();
    window.addEventListener('cms-content-updated', onUpdate);
    return () => window.removeEventListener('cms-content-updated', onUpdate);
  }, []);

  const visible = sections
    .filter(s => s.metadata?.visible !== false)
    .sort((a, b) => (a.metadata?.order ?? 99) - (b.metadata?.order ?? 99));

  return (
    <>
      <SEOHead
        title="Our Programs | Amuse Kenya Forest Adventures"
        description="Explore daily activities, holiday camps, homeschooling, parties, team building & school experiences at Karura Forest, Nairobi."
        keywords="programs, forest activities, outdoor programs Kenya, children programs, nature education, adventure programs, Karura Forest programs"
        canonical="https://amusekenya.co.ke/programs"
      />
      <div className="min-h-screen bg-background">
        <header role="banner"><Navbar /></header>
        <main role="main" className="pt-20">
          {loaded && visible.length === 0 && (
            <div className="container mx-auto max-w-5xl px-4 py-24 text-center">
              <h1 className="text-3xl font-bold mb-3">Programs</h1>
              <p className="text-muted-foreground">
                This page is being prepared. Please check back soon.
              </p>
            </div>
          )}
          {visible.map(s => {
            const kind = s.metadata?.section_kind;
            if (kind === 'custom_cards') {
              return (
                <section key={s.id} aria-label={s.title || 'Cards section'}>
                  <CardsGridSection section={s} />
                </section>
              );
            }
            return (
              <section key={s.id} aria-label={s.title || 'Custom section'}>
                <CustomHomeSection section={s} />
              </section>
            );
          })}
        </main>
        <footer role="contentinfo"><Footer /></footer>
      </div>
    </>
  );
};

export default Programs;
