
import React from 'react';

export const TeamRecruitmentSection: React.FC = () => {
  return (
    <div className="mt-20 bg-forest-100 rounded-2xl p-8 md:p-12 fade-in-element opacity-0 transform translate-y-10 transition-all duration-700" style={{ transitionDelay: '0.5s' }}>
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Join Our Team</h3>
        <p className="text-gray-700 max-w-2xl mx-auto">
          Are you passionate about nature and working with children? We're always looking for enthusiastic individuals to join our growing team at Amuse.Ke.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <a 
          href="#contact" 
          className="bg-forest-500 hover:bg-forest-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300 text-center"
        >
          Contact Us
        </a>
        <a 
          href="#" 
          className="bg-white hover:bg-gray-50 text-forest-700 border border-forest-200 px-6 py-3 rounded-lg font-medium transition-colors duration-300 text-center"
        >
          View Openings
        </a>
      </div>
    </div>
  );
};
