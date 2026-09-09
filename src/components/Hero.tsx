
import React, { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";
import { ArrowDown } from 'lucide-react';
import { useContent } from '@/hooks/useContent';

const Hero = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { getContentValue: getHeading } = useContent('hero', 'heading');
  const { getContentValue: getSubheading } = useContent('hero', 'subheading');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleRegisterClick = () => {
    const contactSection = document.getElementById('contact');
    contactSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <div className={cn("image-blur-placeholder", isLoaded ? "opacity-0" : "opacity-100")}></div>
        <img 
          src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86"
          alt="Tall trees in a forest with sunlight"
          className={cn(
            "w-full h-full object-cover parallax-hero",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
        />
        <div className="absolute inset-0 hero-overlay"></div>
      </div>

      {/* Content */}
      <div className="relative h-full w-full flex flex-col items-center justify-center px-4 text-center">
        <div className="staggered-fade-in max-w-5xl mx-auto">
          <span className="inline-block text-white bg-forest-500/80 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-medium uppercase tracking-wider mb-6">
            Adventure Awaits
          </span>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-md text-balance">
            {getHeading("Forest Adventures at Amuse Kenya")}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8 drop-shadow-md">
            {getSubheading("Join us at Karura Forest for daily activities, camps, birthday parties, and unforgettable outdoor adventures for children aged 3-17.")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#programs" 
              className="bg-forest-500 hover:bg-forest-600 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-transform"
            >
              Explore Programs
            </a>
            <button 
              onClick={handleRegisterClick}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-transform"
            >
              Register Now
            </button>
          </div>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-float">
          <a 
            href="#about" 
            className="flex flex-col items-center text-white/80 hover:text-white transition-colors duration-300"
          >
            <span className="text-sm mb-2">Scroll Down</span>
            <ArrowDown size={20} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
