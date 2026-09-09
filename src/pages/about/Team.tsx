import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TeamSection from '@/components/TeamSection';
import SEOHead from '@/components/SEOHead';

const Team = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Meet Our Team | Amuse Kenya Facilitators & Staff"
        description="Meet the dedicated facilitators and staff at Amuse Kenya who create safe, memorable outdoor experiences for children and families at Karura Forest, Nairobi."
        keywords="Amuse Kenya team, outdoor facilitators Kenya, camp counselors Nairobi, nature educators, children activity leaders"
        canonical="https://amusekenya.co.ke/about/team"
      />
      <Navbar />
      <main className="pt-20">
        <TeamSection />
      </main>
      <Footer />
    </div>
  );
};

export default Team;
