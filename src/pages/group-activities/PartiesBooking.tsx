import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PartiesProgram from '@/components/forms/PartiesProgram';
import SEOHead from '@/components/SEOHead';

const PartiesBooking = () => {
  return (
    <>
      <SEOHead
        title="Birthday Party Booking | Amuse Kenya Forest Adventures"
        description="Book unforgettable birthday parties and special events at Karura Forest. Half-day and full-day packages with nature activities, games, catering, and decor options. Perfect for children's celebrations."
        keywords="birthday party booking, children's party Karura Forest, event hosting Kenya, outdoor party venue, birthday celebration, party packages, forest party, kids birthday"
        canonical="https://amusekenya.co.ke/group-activities/parties/booking"
        ogTitle="Birthday Party Booking at Karura Forest | Amuse Kenya"
        ogDescription="Create magical memories with nature-based birthday parties. Choose from half-day or full-day packages with optional catering and decorations."
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

export default PartiesBooking;
