import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageIcon, Edit, Trash2 } from 'lucide-react';
import { GalleryItem, GalleryCategory, GALLERY_CATEGORIES } from '@/services/galleryService';

interface GalleryGridProps {
  galleryImages: GalleryItem[];
  onEdit: (image: GalleryItem) => void;
  onDelete: (id: string, storagePath: string) => void;
  onCategoryChange: (id: string, category: GalleryCategory) => void;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({ 
  galleryImages, 
  onEdit, 
  onDelete,
  onCategoryChange 
}) => {
  const getCategoryLabel = (category: GalleryCategory) => {
    return GALLERY_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gallery Images</CardTitle>
        <CardDescription>
          {galleryImages.length} images in gallery. Click on category badge to change.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {galleryImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
              <ImageIcon className="h-10 w-10 mb-2" />
              <p>No gallery images found</p>
              <p className="text-sm">Upload images to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {galleryImages.map((image) => (
                <div key={image.id} className="group relative">
                  <div className="aspect-square overflow-hidden rounded-md border bg-muted">
                    <img 
                      src={image.public_url} 
                      alt={image.caption}
                      className="h-full w-full object-cover transition-all hover:scale-105"
                    />
                  </div>
                  
                  {/* Action buttons */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 bg-background/80 hover:bg-background"
                      onClick={() => onEdit(image)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDelete(image.id, image.storage_path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Caption and category */}
                  <div className="mt-2 space-y-1">
                    <p className="text-xs truncate" title={image.caption}>{image.caption}</p>
                    <Select 
                      value={image.category} 
                      onValueChange={(v) => onCategoryChange(image.id, v as GalleryCategory)}
                    >
                      <SelectTrigger className="h-6 text-xs">
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(image.category)}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {GALLERY_CATEGORIES.filter(c => c.value !== 'all').map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
