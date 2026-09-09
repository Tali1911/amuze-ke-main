import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { cmsService } from '@/services/cmsService';

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<number[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    loadTestimonials();
  }, []);
  
  const loadTestimonials = async () => {
    const data = await cmsService.getTestimonials();
    const formatted = data.map(item => ({
      quote: item.content || '',
      name: item.metadata?.author_name || '',
      role: item.metadata?.author_role || '',
      avatarSrc: item.metadata?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'
    }));
    
    // Fallback to defaults if no CMS data
    if (formatted.length === 0) {
      setTestimonials([
        {
          quote: "My son came back from camp with newfound confidence and so many stories about his adventures in the forest. The growth we've seen in him is incredible!",
          name: "Sarah Johnson",
          role: "Parent of Alex, 9",
          avatarSrc: "https://randomuser.me/api/portraits/women/32.jpg"
        },
        {
          quote: "Karura Kids Camp provided the perfect balance of structured activities and free exploration time. My daughter learned so much about nature while having the time of her life.",
          name: "Michael Omondi",
          role: "Parent of Sophia, 7",
          avatarSrc: "https://randomuser.me/api/portraits/men/34.jpg"
        },
        {
          quote: "The counselors were exceptional - knowledgeable, patient, and genuinely passionate about connecting kids with nature. We've already signed up for next summer!",
          name: "Aisha Mwangi",
          role: "Parent of Twins, 10",
          avatarSrc: "https://randomuser.me/api/portraits/women/65.jpg"
        }
      ]);
    } else {
      setTestimonials(formatted);
    }
  };
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  
  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => [...prev, index]);
  };
  
  const nextTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };
  
  const prevTestimonial = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };
  
  return (
    <section id="testimonials" ref={sectionRef} className="py-24 px-4 bg-forest-50">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block text-forest-700 bg-forest-100 px-3 py-1 rounded-full text-sm font-medium mb-4">
            What Parents Say
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-balance">
            The Impact of Our Camp
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Hear from parents about how Karura Kids Camp has made a difference in their children's lives.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto relative">
          <div className="glass-card rounded-2xl shadow-lg overflow-hidden">
            <div className="relative overflow-hidden">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-8 md:p-12 transition-opacity duration-500 absolute inset-0 flex flex-col md:flex-row items-center gap-8",
                    index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
                  )}
                >
                  <div className="flex-shrink-0">
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md">
                      <div className={cn(
                        "absolute inset-0 bg-gray-200 animate-pulse-subtle",
                        loadedImages.includes(index) ? "opacity-0" : "opacity-100"
                      )}></div>
                      <img 
                        src={testimonial.avatarSrc} 
                        alt={testimonial.name}
                        className={cn(
                          "w-full h-full object-cover transition-opacity duration-300",
                          loadedImages.includes(index) ? "opacity-100" : "opacity-0"
                        )}
                        onLoad={() => handleImageLoad(index)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-grow md:ml-6 text-center md:text-left">
                    <div className="mb-4 text-forest-500">
                      <Quote size={32} />
                    </div>
                    <blockquote className="text-lg md:text-xl text-gray-800 mb-6 italic">
                      {testimonial.quote}
                    </blockquote>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Placeholder for height */}
              {testimonials.length > 0 && (
                <div className="p-8 md:p-12 invisible flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full"></div>
                  </div>
                  <div className="flex-grow md:ml-6">
                    <div className="mb-4">
                      <div className="w-8 h-8"></div>
                    </div>
                    <div className="text-lg md:text-xl mb-6">
                      {testimonials[0].quote}
                    </div>
                    <div>
                      <p className="font-semibold"></p>
                      <p className="text-sm"></p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-center mt-8 gap-4">
            <button 
              onClick={prevTestimonial}
              className="bg-white hover:bg-gray-100 text-gray-800 p-2 rounded-full shadow hover:shadow-md transition-all duration-300"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-colors duration-300",
                    index === activeIndex ? "bg-forest-500" : "bg-gray-300"
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
            
            <button 
              onClick={nextTestimonial}
              className="bg-white hover:bg-gray-100 text-gray-800 p-2 rounded-full shadow hover:shadow-md transition-all duration-300"
              aria-label="Next testimonial"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
