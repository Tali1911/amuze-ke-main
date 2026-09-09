import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import TeamBuildingProgram from '@/components/forms/TeamBuildingProgram';

const TeamBuilding = () => {
  return (
    <>
      <SEOHead
        title="Team Building Programs | Amuse Kenya Corporate Events"
        description="Strengthen your team with nature-based team building activities at Karura Forest. Customized corporate programs focusing on collaboration, communication, and leadership development."
        keywords="team building Kenya, corporate events, team activities, leadership training, corporate retreats Nairobi, outdoor team building, group activities"
        canonical="https://amusekenya.co.ke/group-activities/team-building"
      />
      <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20">
        <TeamBuildingProgram />
      </div>
      
      <Footer />
    </div>
    </>
  );
};

export default TeamBuilding;