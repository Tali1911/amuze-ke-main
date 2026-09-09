import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, Clock } from 'lucide-react';
import HolidayCampForm from '@/components/forms/HolidayCampForm';
import { useCampPageConfig } from '@/hooks/useCampPageConfig';
import DynamicMedia from '@/components/content/DynamicMedia';
import RegistrationPageSkeleton from '@/components/skeletons/RegistrationPageSkeleton';
import LocationDetailsAccordion from '@/components/camp/LocationDetailsAccordion';
import RelatedPrograms from '@/components/RelatedPrograms';

const SummerCamp = () => {
  const { config, isLoading, refresh } = useCampPageConfig('summer');

  // Listen for CMS updates and refresh config
  useEffect(() => {
    const handleCMSUpdate = () => {
      refresh?.();
    };
    
    window.addEventListener('cms-content-updated', handleCMSUpdate);
    return () => window.removeEventListener('cms-content-updated', handleCMSUpdate);
  }, [refresh]);

  if (isLoading || !config) {
    return (
      <>
        <SEOHead
          title="Summer Holiday Camp | Amuse Kenya Outdoor Adventures"
          description="Adventure-packed summer camp at Karura Forest. Full-day programs with nature activities, team games, skill development, and unforgettable outdoor experiences for children."
          keywords="summer camp Kenya, holiday camp, summer activities, children's camp Nairobi, outdoor summer camp, adventure camp, school holiday programs"
          canonical="https://amusekenya.co.ke/camps/summer"
        />
        <div className="min-h-screen bg-background">
          <Navbar />
          <RegistrationPageSkeleton />
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title="Summer Holiday Camp | Amuse Kenya Outdoor Adventures"
        description="Adventure-packed summer camp at Karura Forest. Full-day programs with nature activities, team games, skill development, and unforgettable outdoor experiences for children."
        keywords="summer camp Kenya, holiday camp, summer activities, children's camp Nairobi, outdoor summer camp, adventure camp, school holiday programs"
        canonical="https://amusekenya.co.ke/camps/summer"
      />
      <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Program Information */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-primary">
                    {config.title}
                  </h1>
                  <p className="text-lg text-muted-foreground">Adventure-Packed Holiday</p>
                </div>
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {config.description}
              </p>
            </div>

            <div className="relative h-80 rounded-2xl overflow-hidden">
              <DynamicMedia
                mediaType={config.mediaType || 'photo'}
                mediaUrl={config.mediaUrl || config.heroImage}
                fallbackImage={config.heroImage}
                thumbnailUrl={config.videoThumbnail}
                altText={config.mediaAltText || `Children enjoying ${config.title} activities`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {config.locationDetails && config.locationDetails.length > 0 ? (
              <LocationDetailsAccordion locations={config.locationDetails} />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3"><div className="bg-primary/10 rounded-full p-2"><Calendar className="w-5 h-5 text-primary" /></div><div><h3 className="font-semibold text-primary">Duration</h3><p className="text-muted-foreground">{config.duration}</p></div></div>
                  <div className="flex items-start gap-3"><div className="bg-primary/10 rounded-full p-2"><Users className="w-5 h-5 text-primary" /></div><div><h3 className="font-semibold text-primary">Age Group</h3><p className="text-muted-foreground">{config.ageGroup}</p></div></div>
                  <div className="flex items-start gap-3"><div className="bg-primary/10 rounded-full p-2"><MapPin className="w-5 h-5 text-primary" /></div><div><h3 className="font-semibold text-primary">Location</h3><p className="text-muted-foreground">{config.location}</p></div></div>
                  <div className="flex items-start gap-3"><div className="bg-primary/10 rounded-full p-2"><Clock className="w-5 h-5 text-primary" /></div><div><h3 className="font-semibold text-primary">Time</h3><p className="text-muted-foreground">{config.time}</p></div></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-4">Camp Highlights</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    {config.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start gap-2"><span className="text-primary mt-1">•</span>{highlight}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Registration Form */}
          <HolidayCampForm campType="summer" campTitle={config.title} />
        </div>

        <RelatedPrograms currentPath="/camps/summer" />
      </div>
      
      <Footer />
    </div>
    </>
  );
};

export default SummerCamp;