import React from 'react';
import Gallery from '@/components/Gallery';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import SEOHead from '@/components/SEOHead';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const GalleryPage = () => {
  return (
    <>
      <SEOHead
        title="Photo Gallery | Amuse Kenya Adventures"
        description="Browse photos of children's outdoor adventures, camp activities & nature exploration at Karura Forest. See the magic of learning through nature."
        keywords="Amuse Kenya gallery, camp photos, outdoor activities photos, nature adventures, children activities Kenya, forest activities gallery"
        canonical="https://amusekenya.co.ke/gallery"
      />
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
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
                Photo Gallery
              </h1>
              <p className="text-lg text-forest-600 max-w-2xl mx-auto">
                Explore moments of adventure, learning, and joy captured during our nature programs. 
                From wildlife encounters to team-building activities, see the magic we create together.
              </p>
            </div>
            
            <Gallery />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
    </>
  );
};

export default GalleryPage;