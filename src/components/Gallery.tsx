import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { useInView } from "@/hooks/useInView";
import { Button } from '@/components/ui/button';
import SocialShareButtons from './gallery/SocialShareButtons';
import { 
  galleryService, 
  GalleryItem, 
  GalleryCategory, 
  GALLERY_CATEGORIES 
} from '@/services/galleryService';

interface DisplayImage {
  src: string;
  alt: string;
  caption: string;
  category?: GalleryCategory;
}

const DEFAULT_IMAGES: DisplayImage[] = [
  {
    src: "https://images.unsplash.com/photo-1472396961693-142e6e269027",
    alt: "Deer in forest",
    caption: "Wildlife encounters create unforgettable moments"
  },
  {
    src: "https://images.unsplash.com/photo-1518495973542-4542c06a5843",
    alt: "Sunlight through trees",
    caption: "Discovering the magic of light filtering through the forest"
  },
  {
    src: "https://images.unsplash.com/photo-1469474038136-56623f02e42e",
    alt: "Mountain landscape with sun rays",
    caption: "Morning hikes with breathtaking views"
  },
  {
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    alt: "Lake surrounded by trees",
    caption: "Exploring forest waterways and learning about ecosystems"
  },
  {
    src: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f",
    alt: "Deer in forest",
    caption: "Learning to observe wildlife in their natural habitat"
  },
  {
    src: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86",
    alt: "Low angle view of trees",
    caption: "Looking up at the giants of the forest"
  }
];

const Gallery = () => {
  const [activeImage, setActiveImage] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<number[]>([]);
  const [galleryImages, setGalleryImages] = useState<DisplayImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>('all');
  const [total, setTotal] = useState(0);
  const [useDatabase, setUseDatabase] = useState(true);
  
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const isInView = useInView(sectionRef, {
    threshold: 0.1,
    once: true
  });

  const loadGalleryImages = useCallback(async (
    category: GalleryCategory = 'all', 
    pageNum: number = 1, 
    append: boolean = false
  ) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const result = await galleryService.getItems(category, pageNum);
      
      const images: DisplayImage[] = result.items.map((item: GalleryItem) => ({
        src: item.public_url,
        alt: item.caption,
        caption: item.caption,
        category: item.category
      }));

      if (append) {
        setGalleryImages(prev => [...prev, ...images]);
      } else {
        setGalleryImages(images);
        setLoadedImages([]);
      }
      
      setHasMore(result.hasMore);
      setTotal(result.total);
      setUseDatabase(true);
    } catch (error) {
      console.error('Error loading gallery from database:', error);
      // Fallback to default images if database not set up yet
      setGalleryImages([]);
      setUseDatabase(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadGalleryImages(activeCategory, 1, false);
  }, [activeCategory, loadGalleryImages]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadGalleryImages(activeCategory, nextPage, true);
  };

  const handleCategoryChange = (category: GalleryCategory) => {
    setActiveCategory(category);
    setPage(1);
    setLoadedImages([]);
  };

  // Use database images or fallback to defaults
  const images = galleryImages.length > 0 ? galleryImages : (useDatabase ? [] : DEFAULT_IMAGES);

  useEffect(() => {
    if (isInView && images.length > 0) {
      const galleryItems = sectionRef.current?.querySelectorAll('.gallery-item');
      galleryItems?.forEach((el, index) => {
        setTimeout(() => {
          if (el instanceof HTMLElement) {
            el.classList.add('animate-fade-in');
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }
        }, 100 * (index % 6));
      });
    }
  }, [isInView, images.length]);

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => [...prev, index]);
  };

  const openLightbox = (index: number) => {
    setActiveImage(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setActiveImage(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <section id="gallery" ref={sectionRef} className="py-16 px-4 bg-background">
      <div className="container mx-auto">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {GALLERY_CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={activeCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(cat.value)}
              className="rounded-full"
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Results count */}
        {total > 0 && (
          <p className="text-center text-muted-foreground text-sm mb-6">
            Showing {images.length} of {total} photos
          </p>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading gallery...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No photos found in this category.</p>
            <p className="text-muted-foreground text-sm mt-2">
              Try selecting a different category or check back later.
            </p>
          </div>
        ) : (
          <>
            {/* Image Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <div 
                  key={index} 
                  className="gallery-item opacity-0 transform translate-y-10 rounded-xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-all duration-500" 
                  onClick={() => openLightbox(index)} 
                  style={{ transitionDelay: `${0.1 * (index % 6)}s` }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <div className={cn(
                      "w-full h-full bg-muted animate-pulse-subtle absolute top-0 left-0", 
                      loadedImages.includes(index) ? "opacity-0" : "opacity-100"
                    )}></div>
                    <img 
                      src={image.src} 
                      alt={image.alt} 
                      loading="lazy"
                      decoding="async"
                      className={cn(
                        "w-full h-full object-cover transition-all duration-500 hover:scale-105", 
                        loadedImages.includes(index) ? "opacity-100" : "opacity-0"
                      )} 
                      onLoad={() => handleImageLoad(index)} 
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1472396961693-142e6e269027';
                        handleImageLoad(index);
                      }} 
                    />
                  </div>
                  <div className="p-4 bg-card">
                    <p className="text-muted-foreground text-sm">{image.caption}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="min-w-[200px]"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Photos'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Lightbox */}
      {activeImage !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button 
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white z-10" 
            onClick={closeLightbox}
          >
            <X size={24} />
          </button>
          
          {/* Navigation arrows */}
          {activeImage > 0 && (
            <button 
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white z-10"
              onClick={(e) => { e.stopPropagation(); setActiveImage(activeImage - 1); }}
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {activeImage < images.length - 1 && (
            <button 
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white z-10"
              onClick={(e) => { e.stopPropagation(); setActiveImage(activeImage + 1); }}
            >
              <ChevronRight size={24} />
            </button>
          )}
          
          <div className="relative max-w-6xl w-full max-h-[90vh]">
            <img 
              src={images[activeImage].src} 
              alt={images[activeImage].alt} 
              className="w-full h-full object-contain" 
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4">
              <p className="text-center mb-3">{images[activeImage].caption}</p>
              <div className="flex justify-center">
                <SocialShareButtons 
                  imageUrl={images[activeImage].src} 
                  caption={images[activeImage].caption} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
