import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap, Baby, School, Tent, Users, MapPin, Target, Heart, Lightbulb, TreePine,
} from 'lucide-react';
import { cmsService, ContentItem } from '@/services/cmsService';
import PillarColumn from '@/components/about/PillarColumn';
import PillarDialog from '@/components/about/PillarDialog';
import CustomAboutSection from '@/components/about/CustomAboutSection';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { TeamMemberModal } from '@/components/team/TeamMemberModal';

const iconMap: Record<string, any> = {
  GraduationCap, Baby, School, Tent, Users, MapPin, Target, Heart, Lightbulb, TreePine,
};

const pillarColors = [
  '#2563eb', '#16a34a', '#dc2626', '#06b6d4', '#84cc16', '#d946ef', '#92400e',
];

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  shortDescription?: string;
  image: string;
  specialization: string;
  icon: string;
}

const About = () => {
  const [aboutSections, setAboutSections] = useState<ContentItem[]>([]);
  const [services, setServices] = useState<ContentItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPillar, setSelectedPillar] = useState<ContentItem | null>(null);
  const [pillarDialogOpen, setPillarDialogOpen] = useState(false);

  const [showAllTeam, setShowAllTeam] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);

  useEffect(() => {
    loadAll();
    const onUpdate = () => loadAll();
    window.addEventListener('cms-content-updated', onUpdate);
    return () => window.removeEventListener('cms-content-updated', onUpdate);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [about, svc, team] = await Promise.all([
        cmsService.getAboutSections(),
        cmsService.getServiceItems(),
        cmsService.getTeamMembers(),
      ]);
      setAboutSections(about);
      setServices(svc);
      setTeamMembers(
        team.map((item) => ({
          id: item.id,
          name: item.title,
          role: item.metadata?.role || '',
          bio: item.content || '',
          shortDescription: item.metadata?.short_description,
          image: item.metadata?.image_url || '',
          specialization: item.metadata?.specialization || '',
          icon: item.metadata?.icon || 'User',
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const intro = useMemo(
    () => aboutSections.find((s) => s.metadata?.section_type === 'intro'),
    [aboutSections]
  );
  const pillars = useMemo(
    () =>
      aboutSections
        .filter((s) => s.metadata?.section_type === 'pillar')
        .sort((a, b) => (a.metadata?.order || 0) - (b.metadata?.order || 0)),
    [aboutSections]
  );
  const purpose = useMemo(
    () => aboutSections.find((s) => s.metadata?.section_type === 'purpose'),
    [aboutSections]
  );
  const mission = useMemo(
    () => aboutSections.find((s) => s.metadata?.section_type === 'mission'),
    [aboutSections]
  );
  const vision = useMemo(
    () => aboutSections.find((s) => s.metadata?.section_type === 'vision'),
    [aboutSections]
  );
  const customSections = useMemo(
    () =>
      aboutSections
        .filter((s) => s.metadata?.section_type === 'custom')
        .sort((a, b) => (a.metadata?.order || 0) - (b.metadata?.order || 0)),
    [aboutSections]
  );

  const firstFourTeam = teamMembers.slice(0, 4);
  const remainingTeam = teamMembers.slice(4);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="About Amuse Kenya | Who We Are, What We Do & Our Team"
        description="Discover Amuse Kenya's story, mission, values and the team behind our outdoor learning experiences for children in Nairobi."
        keywords="Amuse Kenya about, mission, values, outdoor education team, Karura Forest, Nairobi"
        canonical="https://amusekenya.co.ke/about"
      />
      <Navbar />

      <main className="pt-20">
        {/* Hero */}
        <section className="bg-forest-50 py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <span className="inline-block text-forest-700 bg-white/70 px-3 py-1 rounded-full text-sm font-medium mb-4">
              About Us
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Amuse Kenya</h1>
            <p className="text-lg text-muted-foreground">
              Learn more about who we are, what we do, and the people behind our outdoor adventures.
            </p>
          </div>
        </section>

        {/* Who We Are */}
        <section id="who-we-are" className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Who We Are</h2>

            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <>
                <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                  {intro?.content ||
                    'At Amuse, we believe that the best way for children to learn is by exploring, experiencing, and engaging with the world around them. We specialize in creating outdoor programs that inspire curiosity, foster independence, and build lasting skills — all while having fun in nature.'}
                </p>

                {pillars.length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-2xl font-bold mb-6 text-center">Our Pillars</h3>
                    <div className="max-w-5xl mx-auto mb-6">
                      <div className="h-2 bg-foreground/80 w-full rounded-sm mb-1" />
                      <div className="h-2 bg-foreground/60 w-11/12 mx-auto rounded-sm" />
                    </div>
                    <div className="flex justify-center gap-1 sm:gap-2 md:gap-4 lg:gap-5 max-w-6xl mx-auto px-2">
                      {pillars.map((section, index) => (
                        <PillarColumn
                          key={section.id || index}
                          pillar={section}
                          color={pillarColors[index % pillarColors.length]}
                          onClick={() => {
                            setSelectedPillar(section);
                            setPillarDialogOpen(true);
                          }}
                        />
                      ))}
                    </div>
                    <div className="max-w-5xl mx-auto mt-6">
                      <div className="h-4 bg-foreground/20 w-full rounded-sm" />
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Our Purpose</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {purpose?.content ||
                        'To empower children and teens to discover their full potential through engaging and educational programs that foster creativity, curiosity, and a deep connection to the natural world.'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Our Mission</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {mission?.content ||
                        'To inspire and empower children and teens through safe, fun, and transformative outdoor experiences that spark creativity, build character, and nurture a lifelong love for nature.'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Our Vision</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {vision?.content ||
                        'To shape the future of experiential education in Africa by creating world-class outdoor experiences that inspire children to learn boldly, live responsibly, and champion the protection of our natural spaces.'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* What We Do */}
        <section id="what-we-do" className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">What We Do</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10">
              We design and deliver a wide range of high-quality outdoor programs that integrate learning, fun and adventure.
              Our experiences provide meaningful opportunities to explore the outdoors, build new skills, and develop a
              deeper appreciation for the natural environment.
            </p>

            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {services.map((service, idx) => {
                  const Icon = iconMap[service.metadata?.icon || 'GraduationCap'];
                  return (
                    <Card key={service.id || idx} className="border-primary/20 hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                            {Icon && <Icon className="h-6 w-6 text-primary" />}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                            <p className="text-muted-foreground">{service.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Meet Our Team */}
        <section id="team" className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-10">
              <span className="inline-block text-forest-700 bg-forest-100 px-3 py-1 rounded-full text-sm font-medium mb-3">
                Our Team
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Meet Our Team</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A dedicated team of facilitators and nature enthusiasts making every experience meaningful.
              </p>
            </div>

            {teamMembers.length === 0 ? (
              <p className="text-center text-muted-foreground">No team members added yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {firstFourTeam.map((member, index) => (
                    <TeamMemberCard
                      key={member.id || index}
                      member={member}
                      index={index}
                      onClick={() => {
                        setSelectedMember(member);
                        setMemberModalOpen(true);
                      }}
                    />
                  ))}
                </div>

                {remainingTeam.length > 0 && (
                  <>
                    {showAllTeam && (
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {remainingTeam.map((member, index) => (
                          <TeamMemberCard
                            key={member.id || index}
                            member={member}
                            index={index}
                            onClick={() => {
                              setSelectedMember(member);
                              setMemberModalOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="text-center mt-10">
                      <Button
                        variant="outline"
                        className="border-forest-500 text-forest-700 hover:bg-forest-50"
                        onClick={() => setShowAllTeam(!showAllTeam)}
                      >
                        {showAllTeam ? 'Show Less' : 'View the Rest of the Team'}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {/* Custom CMS sections */}
        {customSections.map((section) => (
          <CustomAboutSection key={section.id} section={section} />
        ))}
      </main>

      <PillarDialog
        isOpen={pillarDialogOpen}
        onClose={() => {
          setPillarDialogOpen(false);
          setSelectedPillar(null);
        }}
        pillar={selectedPillar}
      />

      <TeamMemberModal
        member={selectedMember}
        isOpen={memberModalOpen}
        onClose={() => {
          setMemberModalOpen(false);
          setSelectedMember(null);
        }}
      />

      <Footer />
    </div>
  );
};

export default About;
