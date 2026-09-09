import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomeschoolingProgram from '@/components/forms/HomeschoolingProgram';
import SEOHead from '@/components/SEOHead';

const Homeschooling = () => {
  return (
    <>
      <SEOHead
        title="Homeschooling Outdoor Experiences | Amuse Kenya Nairobi"
        description="Structured nature-based education for homeschooling families. Physical education, sports modules, STEM integration, and nature immersion for ages 4-17 at Karura Forest, Nairobi."
        keywords="homeschooling Kenya, outdoor education Nairobi, physical education homeschool, nature immersion, sports modules, STEM outdoor learning, Karura Forest homeschool"
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
