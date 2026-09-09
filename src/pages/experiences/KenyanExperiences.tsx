import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import KenyanExperiencesProgram from '@/components/forms/KenyanExperiencesProgram';

const KenyanExperiences = () => {
  return (
    <>
      <SEOHead
        title="Kenyan Experiences Program | Amuse Kenya Cultural & Nature Tours"
        description="Explore authentic Kenyan cultural and nature experiences. Guided tours, wildlife encounters, traditional activities, and educational programs celebrating Kenya's rich heritage and biodiversity."
        keywords="Kenyan experiences, cultural tours Kenya, nature tours, wildlife experiences, heritage programs, educational tours, authentic Kenya, cultural education"
        canonical="https://amusekenya.co.ke/experiences/kenyan-experiences"
      />
      <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20">
        <KenyanExperiencesProgram />
      </div>
      
      <Footer />
    </div>
    </>
  );
};

export default KenyanExperiences;