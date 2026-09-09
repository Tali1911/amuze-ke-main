import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { cmsService, ContentItem } from "@/services/cmsService";
import PillarColumn from "@/components/about/PillarColumn";
import PillarDialog from "@/components/about/PillarDialog";

// Color mapping for the 7 pillars (in order)
const pillarColors = [
  "#2563eb", // Kenyan Based - Blue
  "#16a34a", // Nature - Green
  "#dc2626", // Holistic Skills - Red
  "#06b6d4", // Fun - Cyan
  "#84cc16", // Inclusivity - Yellow/Olive
  "#d946ef", // Child Centered Approach - Magenta
  "#92400e", // Environmental Approach - Brown
];

const WhoWeAre = () => {
  const [sections, setSections] = useState<ContentItem[]>([]);
  const [introSection, setIntroSection] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState<ContentItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await cmsService.getAboutSections();
      const intro = data.find((s) => s.metadata?.section_type === "intro");
      // Only get the 7 pillars with section_type = 'pillar'
      const pillars = data
        .filter((s) => s.metadata?.section_type === "pillar")
        .sort((a, b) => {
          const orderA = a.metadata?.order || 0;
          const orderB = b.metadata?.order || 0;
          return orderA - orderB;
        });
      setIntroSection(intro || null);
      setSections(pillars);
    } catch (error) {
      console.error("Error loading about sections:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Who We Are | Amuse Kenya — Mission & Values"
        description="Learn about Amuse Kenya's mission to make outdoor learning meaningful & unforgettable for children aged 3-17 in Nairobi. Discover our 7 core pillars."
        keywords="Amuse Kenya about, outdoor education mission, nature learning Kenya, children outdoor programs Nairobi, Karura Forest education"
        canonical="https://amusekenya.co.ke/about/who-we-are"
      />
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Who We Are</h1>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <>
                <div className="prose prose-lg max-w-none mb-12">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {introSection?.content ||
                      "At Amuse, we believe that the best way for children to learn is by exploring, experiencing, and engaging with the world around them. We specialize in creating outdoor programs that inspire curiosity, foster independence, and build lasting skills—all while having fun in nature."}
                  </p>
                </div>

                {/* Our Pillars Section */}
                <div className="mb-16">
                  <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Our Pillars</h2>

                  {/* Temple Roof Decoration */}
                  <div className="max-w-5xl mx-auto mb-8">
                    <div className="h-2 bg-foreground/80 w-full rounded-sm mb-1"></div>
                    <div className="h-2 bg-foreground/60 w-11/12 mx-auto rounded-sm"></div>
                  </div>

                  {/* Pillars Container */}
                  <div className="flex justify-center gap-1 sm:gap-2 md:gap-4 lg:gap-5 max-w-6xl mx-auto px-2">
                    {sections.map((section, index) => (
                      <PillarColumn
                        key={section.id || index}
                        pillar={section}
                        color={pillarColors[index % pillarColors.length]}
                        onClick={() => {
                          setSelectedPillar(section);
                          setIsDialogOpen(true);
                        }}
                      />
                    ))}
                  </div>

                  {/* Base Platform */}
                  <div className="max-w-5xl mx-auto mt-8">
                    <div className="h-4 bg-foreground/20 w-full rounded-sm"></div>
                  </div>
                </div>

                {/* Our Purpose, Mission, Vision Sections */}
                <div className="space-y-12">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">Our Purpose</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Our purpose is to empower children and teens to discover their full potential through engaging and
                      educational programs that foster creativity, curiosity, and a deep connection to the natural
                      world.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      To inspire and empower children and teens through safe, fun, and transformative outdoor
                      experiences that spark creativity, build character, and nurture a lifelong love for nature.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-4">Our Vision</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      To shape the future of experiential education in Africa by creating world-class outdoor
                      experiences that inspire children and teens to learn boldly, live responsibly, and champion the
                      protection of our natural spaces.
                    </p>
                  </div>
                </div>

                {/* Pillar Details Dialog */}
                <PillarDialog
                  isOpen={isDialogOpen}
                  onClose={() => {
                    setIsDialogOpen(false);
                    setSelectedPillar(null);
                  }}
                  pillar={selectedPillar}
                />
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WhoWeAre;
