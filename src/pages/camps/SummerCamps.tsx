import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProgramsOverview from '@/components/forms/ProgramsOverview';

const SummerCamps = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20">
        <ProgramsOverview />
      </div>
      
      <Footer />
    </div>
  );
};
export default SummerCamps;