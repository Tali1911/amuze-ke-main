import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useInView } from '@/hooks/useInView';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TeamMemberCard } from '@/components/team/TeamMemberCard';
import { TeamMemberModal } from '@/components/team/TeamMemberModal';
import { TeamRecruitmentSection } from '@/components/team/TeamRecruitmentSection';
import { cmsService } from '@/services/cmsService';

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

const TeamSection = () => {
  const [showRecruitment, setShowRecruitment] = useState<boolean>(false);
  const [showAllTeam, setShowAllTeam] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, threshold: 0.1 });
  
  const [content] = useLocalStorage<any[]>('site-content', []);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [localTeamMembers] = useLocalStorage<TeamMember[]>('team-members', []);
  const [siteImages] = useLocalStorage<any[]>('site-images', []);
  
  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    const data = await cmsService.getTeamMembers();
    const formatted = data.map(item => ({
      id: item.id,
      name: item.title,
      role: item.metadata?.role || '',
      bio: item.content || '',
      shortDescription: item.metadata?.short_description,
      image: item.metadata?.image_url || '',
      specialization: item.metadata?.specialization || '',
      icon: item.metadata?.icon || 'User'
    }));
    
    // Use CMS data if available, otherwise fallback to localStorage
    setTeamMembers(formatted.length > 0 ? formatted : localTeamMembers);
  };
  
  const headingContent = content.find(item => item.section === 'team' && item.key === 'heading')?.content || 
    "Meet The Nature Enthusiasts";
    
  const subheadingContent = content.find(item => item.section === 'team' && item.key === 'subheading')?.content || 
    "Our dedicated team brings diverse expertise and a shared passion for connecting children with the natural world at Amuse.Ke.";

  // Don't slice the team members to ensure all members are displayed
  const displayedMembers = teamMembers;
  const remainingMembers = [];

  useEffect(() => {
    const savedRecruitmentState = localStorage.getItem('showRecruitment');
    if (savedRecruitmentState !== null) {
      setShowRecruitment(JSON.parse(savedRecruitmentState));
    }
  }, []);

  useEffect(() => {
    if (isInView) {
      const fadeElements = sectionRef.current?.querySelectorAll('.fade-in-element');
      fadeElements?.forEach((el, index) => {
        setTimeout(() => {
          if (el instanceof HTMLElement) {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }
        }, 150 * index);
      });
    }
  }, [isInView]);

  return (
    <section 
      id="team" 
      ref={sectionRef}
      className="relative py-24 px-4 bg-gradient-to-b from-white to-forest-50"
    >
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16 fade-in-element opacity-0 transform translate-y-10 transition-all duration-700">
          <span className="inline-block text-forest-700 bg-forest-100 px-3 py-1 rounded-full text-sm font-medium mb-4">
            Our Team
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {headingContent}
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            {subheadingContent}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayedMembers.length > 0 ? (
            displayedMembers.map((member, index) => (
              <TeamMemberCard 
                key={member.id || index} 
                member={member} 
                index={index}
                onClick={() => {
                  setSelectedMember(member);
                  setIsModalOpen(true);
                }}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No team members have been added yet.
            </div>
          )}
        </div>
        
        {remainingMembers.length > 0 && (
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              className="border-forest-500 text-forest-700 hover:bg-forest-50"
              onClick={() => setShowAllTeam(!showAllTeam)}
            >
              {showAllTeam ? "Show Less" : "View All Team Members"}
            </Button>
          </div>
        )}
        
        {showAllTeam && remainingMembers.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {remainingMembers.map((member, index) => (
              <TeamMemberCard 
                key={member.id || index} 
                member={member} 
                index={index}
                onClick={() => {
                  setSelectedMember(member);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
        
        {showRecruitment && <TeamRecruitmentSection />}
      </div>
      
      <TeamMemberModal 
        member={selectedMember}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMember(null);
        }}
      />
    </section>
  );
};

export default TeamSection;
