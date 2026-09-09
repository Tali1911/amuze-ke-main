import React, { useState, useEffect, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { Bell, ChevronRight, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cmsService } from "@/services/cmsService";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  poster?: string;
}

interface MediaItem {
  id: string;
  url: string;
  alt: string;
  section: string;
  uploadedAt: string;
  type: 'image' | 'pdf';
  filename?: string;
}

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [postersWithAnnouncements, setPostersWithAnnouncements] = useState<Announcement[]>([]);
  const [galleryImages] = useLocalStorage<MediaItem[]>('site-images', []);
  const [documents, setDocuments] = useState<MediaItem[]>([]);
  const [selectedPoster, setSelectedPoster] = useState<Announcement | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const cmsAnnouncements = await cmsService.getPublishedAnnouncements();
        const formattedAnnouncements = cmsAnnouncements.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content || '',
          date: new Date(item.published_at || item.created_at).toLocaleDateString(),
          priority: item.metadata?.priority || 'medium',
          poster: item.metadata?.posterUrl || ''
        }));
        setAnnouncements(formattedAnnouncements);
        const withPosters = formattedAnnouncements.filter(a => a.poster);
        setPostersWithAnnouncements(withPosters);

        const docs = galleryImages.filter(item => item.type === 'pdf' && (item.section === 'announcements' || item.section === 'documents'));
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };
    fetchAnnouncements();
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (!carouselApi) return;

    const autoScroll = setInterval(() => {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else {
        carouselApi.scrollTo(0);
      }
    }, 4000);

    return () => clearInterval(autoScroll);
  }, [carouselApi]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getPriorityStyles = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-amber-50 border-amber-200';
      case 'low':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getPriorityBadgeStyles = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const displayPosters = postersWithAnnouncements.length > 0 ? postersWithAnnouncements : [{
    id: "poster1",
    title: "Nature Camp Registration Open",
    date: "June 15, 2023",
    content: 'Join us for an exciting nature camp experience! Our camp offers hands-on activities, wildlife exploration, and outdoor adventures for children of all ages.',
    priority: 'medium' as 'low' | 'medium' | 'high',
    poster: "https://source.unsplash.com/photo-1500673922987-e212871fec22"
  }, {
    id: "poster2",
    title: "Summer Adventure Program",
    date: "July 10, 2023",
    content: 'Our summer adventure program is packed with exciting activities including hiking, camping, and team-building exercises. Register now to secure your spot!',
    priority: 'medium' as 'low' | 'medium' | 'high',
    poster: "https://source.unsplash.com/photo-1433086966358-54859d0ed716"
  }, {
    id: "poster3",
    title: "Wildlife Photography Workshop",
    date: "August 5, 2023",
    content: 'Learn the art of wildlife photography from professional photographers. This workshop covers camera techniques, animal behavior, and field photography skills.',
    priority: 'medium' as 'low' | 'medium' | 'high',
    poster: "https://source.unsplash.com/photo-1472396961693-142e6e269027"
  }];

  return (
    <section id="announcements" className="py-24 px-4 bg-gray-50">
      <div className="container mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block text-forest-700 bg-forest-100 px-3 py-1 rounded-full text-sm font-medium mb-4">
            Stay Updated
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-balance">
            Announcements & Updates
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">Keep up with the latest news, events, and important information from Amuse Kenya.</p>
        </div>
        
        {/* Visual Announcements Carousel with Auto-scroll */}
        {displayPosters.length > 0 && (
          <div className="max-w-4xl mx-auto mb-16">
            <h3 className="text-2xl font-semibold text-center mb-6">Upcoming Events</h3>
            <Carousel 
              className="w-full" 
              setApi={setCarouselApi}
              opts={{
                align: "start",
                loop: true,
              }}
            >
              <CarouselContent>
                {displayPosters.map(poster => (
                  <CarouselItem key={poster.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <div 
                        className="overflow-hidden rounded-xl shadow-lg bg-white cursor-pointer group"
                        onClick={() => setSelectedPoster(poster)}
                      >
                        <div className="relative">
                          <AspectRatio ratio={3 / 4} className="bg-muted">
                            <img 
                              src={poster.poster} 
                              alt={poster.title} 
                              className="object-cover w-full h-full transition-all group-hover:scale-110 duration-500" 
                              onError={e => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1500673922987-e212871fec22';
                              }} 
                            />
                          </AspectRatio>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                            <h4 className="text-white font-semibold line-clamp-2">{poster.title}</h4>
                            <p className="text-white/80 text-sm mt-1">{poster.date}</p>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="bg-white/90 text-gray-900 px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                              Click to view details
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            
            {/* Carousel indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {displayPosters.map((_, index) => (
                <button
                  key={index}
                  className="w-2 h-2 rounded-full bg-gray-300 hover:bg-primary transition-colors"
                  onClick={() => carouselApi?.scrollTo(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Poster Detail Dialog */}
        <Dialog open={!!selectedPoster} onOpenChange={() => setSelectedPoster(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedPoster?.title}</DialogTitle>
              <DialogDescription className="text-base">
                {selectedPoster?.date}
              </DialogDescription>
            </DialogHeader>
            {selectedPoster && (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={selectedPoster.poster} 
                    alt={selectedPoster.title}
                    className="w-full h-auto max-h-[50vh] object-contain bg-muted"
                    onError={e => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1500673922987-e212871fec22';
                    }}
                  />
                </div>
                {selectedPoster.content && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed">{selectedPoster.content}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Text Announcements */}
        <div className="max-w-4xl mx-auto mb-16">
          <h3 className="text-2xl font-semibold text-center mb-6">Latest Updates</h3>
          {!announcements || announcements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No announcements at this time.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {announcements.map(announcement => (
                <Alert key={announcement.id} className={cn("transition-all duration-300", getPriorityStyles(announcement.priority))}>
                  <div className="flex items-start">
                    <Bell className="h-5 w-5 mt-0.5 mr-3" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <AlertTitle className="text-gray-900">{announcement.title}</AlertTitle>
                          <span className={cn("text-xs px-2 py-1 rounded-full", getPriorityBadgeStyles(announcement.priority))}>
                            {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)} Priority
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{announcement.date}</span>
                      </div>
                      <AlertDescription className={cn("text-gray-700 transition-all duration-300 overflow-hidden", expandedId === announcement.id ? "max-h-96" : "max-h-8 line-clamp-1")}>
                        {announcement.content}
                      </AlertDescription>
                      <Button variant="ghost" size="sm" className="mt-2 text-forest-600 hover:text-forest-700 hover:bg-forest-50 p-0 h-auto" onClick={() => toggleExpand(announcement.id)}>
                        {expandedId === announcement.id ? "Read Less" : "Read More"}
                        <ChevronRight size={16} className={cn("ml-1 transition-transform duration-300", expandedId === announcement.id ? "rotate-90" : "")} />
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </div>
        
        {/* Downloadable Documents Section */}
        {documents.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold text-center mb-6">Documents & Resources</h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {documents.map(doc => (
                <a 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  download={doc.filename} 
                  key={doc.id} 
                  className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="bg-forest-100 p-3 rounded-md mr-4">
                    <FileText className="h-6 w-6 text-forest-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">{doc.alt}</h4>
                    <p className="text-sm text-gray-500">
                      {doc.filename || 'Download PDF'}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Announcements;