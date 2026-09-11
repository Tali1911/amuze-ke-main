import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomeschoolingProgram from '@/components/forms/HomeschoolingProgram';
import SEOHead from '@/components/SEOHead';

const Homeschooling = () => {
  return (
    <>
      <SEOHead
        title="Homeschool Programme | Amuse Kenya Nairobi"
        description="Nature-based homeschool learning in Nairobi. Explorers (once a week, half day) and Adventure (Wednesday and Friday, full day) outdoor sessions for ages 3 and below to 15."
        keywords="homeschool Kenya, homeschool programme Nairobi, outdoor education, nature-based learning, bushcraft, horse riding, Karura Forest homeschool"
        canonical="https://amusekenya.co.ke/programs/homeschooling"
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="pt-20">
          <HomeschoolingProgram />
        </div>
        
        <Footer />
      </div>
    </>
  );
};

export default Homeschooling;
