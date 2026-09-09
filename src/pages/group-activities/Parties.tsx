import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PartiesProgram from '@/components/forms/PartiesProgram';
import SEOHead from '@/components/SEOHead';

const Parties = () => {
  return (
    <>
      <SEOHead
        title="Parties & Celebrations | Amuse Kenya Forest Adventures"
        description="Host unforgettable birthday parties and celebrations at Karura Forest, at your venue, or as an overnight camping experience. Outdoor adventure parties for all ages."
        keywords="birthday parties Kenya, outdoor celebrations, children's party venue, forest parties, group events, party packages Karura, outdoor party venue Nairobi"
        canonical="https://amusekenya.co.ke/group-activities/parties"
        ogTitle="Parties & Celebrations at Karura Forest | Amuse Kenya"
        ogDescription="Create magical memories with nature-based birthday parties. Choose from Karura Forest, at-home, or overnight camping options."
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="pt-20">
          <PartiesProgram />
        </div>
        
        <Footer />
      </div>
    </>
  );
};

export default Parties;
