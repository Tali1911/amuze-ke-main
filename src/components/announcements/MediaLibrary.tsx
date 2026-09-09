
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageIcon } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MediaItem {
  id: string;
  url: string;
  alt: string;
  section: string;
  uploadedAt: string;
  type: 'image' | 'pdf';
  filename?: string;
}

interface MediaLibraryProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  filteredImages: MediaItem[];
  onSelectImage: (imageUrl: string) => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  isOpen,
  onOpenChange,
  filteredImages,
  onSelectImage
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription>
            Select an image from your media library
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px]">
          {filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 mb-2" />
              <p>No images found in the Announcements section</p>
              <p className="text-sm">Upload images to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredImages.map((image) => (
                <div 
                  key={image.id} 
                  className="group relative cursor-pointer"
                  onClick={() => onSelectImage(image.url)}
                >
                  <div className="aspect-square overflow-hidden rounded-md border bg-muted">
                    <img 
                      src={image.url} 
                      alt={image.alt}
                      className="h-full w-full object-cover transition-all hover:scale-105"
                    />
                  </div>
                  <div className="mt-1 text-xs truncate">{image.alt}</div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
