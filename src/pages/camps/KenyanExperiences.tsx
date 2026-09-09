import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import KenyanExperiencesProgram from '@/components/forms/KenyanExperiencesProgram';
import { Link } from 'react-router-dom';
const KenyanExperiences = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20">
        <KenyanExperiencesProgram />
      </div>
      
      <Footer />
    </div>
  );
};
export default KenyanExperiences;