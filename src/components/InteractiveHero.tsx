import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ArrowDown } from 'lucide-react';
import { cmsService } from '@/services/cmsService';
import adventureImage from '@/assets/adventure.jpg';
import schoolsImage from '@/assets/schools.jpg';
import campingImage from '@/assets/camping.jpg';
import birthdayImage from '@/assets/birthday.jpg';

const defaultSlides = [
  {
    id: 1,
    title: "Mountain Biking",
    subtitle: "Experience the thrill of mountain biking through scenic trails",
    description: "Exhilarating", 
    image: adventureImage,
    buttonText: "Book Now",
    badge: "Outdoor Adventure",
    secondaryButtonText: "View All Programs",
    detailPageSlug: ""
  },
  {
    id: 2,
    title: "Orienteering",
    subtitle: "Master the art of navigation while exploring the great outdoors",
    description: "Challenging",
    image: schoolsImage,
    buttonText: "Learn More",
    badge: "Navigation Skills",
    secondaryButtonText: "View All Programs",
    detailPageSlug: ""
  },
  {
    id: 3,
    title: "Obstacle Course",
    subtitle: "Test your strength, agility, and determination on our exciting obstacle courses",
    description: "Thrilling",
    image: campingImage,
    buttonText: "Take the Challenge",
    badge: "Physical Adventure",
    secondaryButtonText: "View All Programs",
    detailPageSlug: ""
  },
  {
    id: 4,
    title: "Little Explorer",
    subtitle: "Nurturing sensory exploration and early development for children aged three and below",
    description: "Nurturing",
    image: birthdayImage,
    buttonText: "Explore Program",
    badge: "Ages 0-3",
    secondaryButtonText: "View All Programs",
    detailPageSlug: "little-forest"
  }
];

const InteractiveHero = () => {
  const [slides, setSlides] = useState(defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance to trigger slide change
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  useEffect(() => {
    const loadSlides = async () => {
      const cmsSlides = await cmsService.getHeroSlides();
      if (cmsSlides.length > 0) {
        setSlides(cmsSlides.map((item, index) => ({
          id: index + 1,
          title: item.title,
          subtitle: item.metadata?.subtitle || '',
          description: item.content || item.title,
          image: item.metadata?.imageUrl || adventureImage,
          buttonText: item.metadata?.buttonText || 'Book Now',
          badge: item.metadata?.badge || '',
          secondaryButtonText: item.metadata?.secondaryButtonText || 'View All Programs',
          detailPageSlug: item.metadata?.detailPageSlug
        })));
      }
    };
    loadSlides();
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      if (!isTransitioning) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isTransitioning, isPaused, slides.length]);

  const nextSlide = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setIsPaused(true);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 700);
    }
  };

  const prevSlide = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      setIsPaused(true);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 700);
    }
  };

  const goToSlide = (index: number) => {
    if (index !== currentSlide && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide(index);
      setIsPaused(true);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 700);
    }
  };

  const handleRegisterClick = () => {
    // Primary button always goes to contact page
    window.location.href = '/contact';
  };

  const handleSecondaryClick = () => {
    const currentSlideData = slides[currentSlide];
    if (currentSlideData.detailPageSlug) {
      window.location.href = `/activity/${currentSlideData.detailPageSlug}`;
    } else {
      window.location.href = '/programs';
    }
  };

  const scrollToNextSection = () => {
    const heroHeight = window.innerHeight;
    window.scrollTo({
      top: heroHeight,
      behavior: 'smooth'
    });
  };

  const getCardPosition = (index: number) => {
    const diff = index - currentSlide;
    const normalizedDiff = diff > slides.length / 2 
      ? diff - slides.length 
      : diff < -slides.length / 2 
      ? diff + slides.length 
      : diff;
    
    return normalizedDiff;
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 w-full h-full transition-all duration-700 ease-in-out",
            index === currentSlide 
              ? "opacity-100 scale-100 z-10" 
              : "opacity-0 scale-105 z-0 pointer-events-none"
          )}
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
          </div>

          <div className="relative h-full container mx-auto px-4 md:px-8 lg:px-12 flex items-center z-20">
            <div className="max-w-2xl">
              <div className={cn(
                "transition-all duration-700 delay-100",
                isLoaded && index === currentSlide
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              )}>
                {slide.badge && (
                  <div className="mb-6">
                    <span className="inline-block bg-primary text-white px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wide">
                      {slide.badge}
                    </span>
                  </div>
                )}

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white">
                  {slide.title}
                </h1>
                
                <p className="text-lg md:text-xl mb-8 text-white/90 leading-relaxed">
                  {slide.subtitle}
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={handleRegisterClick}
                    className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all shadow-lg"
                  >
                    {slide.buttonText}
                  </button>
                  <button 
                    onClick={handleSecondaryClick}
                    className="px-8 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/50 text-white rounded-lg font-semibold hover:bg-white/20 transition-all"
                  >
                    {slides[currentSlide].secondaryButtonText}
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 h-[600px] items-center justify-center z-30">
              <div className="relative w-80 h-full flex items-center justify-center">
                {slides.map((slide, index) => {
                  const position = getCardPosition(index);
                  const isActive = position === 0;
                  const isPrev = position === -1;
                  const isNext = position === 1;
                  const isVisible = Math.abs(position) <= 1;

                  return (
                    <button
                      key={slide.id}
                      onClick={() => goToSlide(index)}
                      className={cn(
                        "absolute overflow-hidden rounded-xl transition-all duration-700 ease-in-out",
                        isActive && "w-80 h-56 ring-4 ring-white shadow-2xl z-20",
                        !isActive && "w-64 h-44 ring-2 ring-white/30 hover:ring-white/60 shadow-lg",
                        !isVisible && "opacity-0 pointer-events-none"
                      )}
                      style={{
                        transform: `translateY(${position * 140}px) scale(${isActive ? 1 : 0.85})`,
                        opacity: isVisible ? 1 : 0,
                        zIndex: isActive ? 20 : isVisible ? 10 : 0,
                      }}
                    >
                      <img 
                        src={slide.image} 
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className={cn("font-bold mb-1", isActive ? "text-xl" : "text-lg")}>{slide.title}</h3>
                        <p className="text-sm text-white/80">{slide.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation arrows positioned at bottom to avoid overlapping content */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-8">
        <button
          onClick={prevSlide}
          className="bg-black/30 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/50 transition-all group"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                index === currentSlide
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="bg-black/30 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/50 transition-all group lg:hidden"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>


      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center text-white">
        <span className="text-sm mb-2">Scroll Down</span>
        <button
          onClick={scrollToNextSection}
          className="animate-bounce"
          aria-label="Scroll to next section"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default InteractiveHero;
