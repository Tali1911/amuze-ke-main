import React from 'react';
import ContactForm from '@/components/ContactForm';
import ServiceLocationsMap from '@/components/ServiceLocationsMap';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import SEOHead from '@/components/SEOHead';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Contact = () => {
  return (
    <>
      <SEOHead
        title="Contact Us | Amuse Kenya - Get in Touch"
        description="Contact Amuse Kenya for inquiries about camps, parties & outdoor programs. We're here to help plan your perfect nature experience."
        keywords="contact Amuse Kenya, inquiries, booking information, program details, Karura Forest contact, outdoor education contact"
        canonical="https://amusekenya.co.ke/contact"
      />
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-700 font-medium"
              >
                <ArrowLeft size={20} />
                Back to Home
              </Link>
            </div>
            
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-forest-800 mb-4">
                Contact Us
              </h1>
              <p className="text-lg text-forest-600 max-w-2xl mx-auto">
                Have questions about our programs? Want to plan a custom adventure? 
                We'd love to hear from you and help create an unforgettable nature experience.
              </p>
            </div>
            
            <ContactForm />
            
            <ServiceLocationsMap />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
    </>
  );
};

export default Contact;