import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GalleryItem, GalleryCategory, GALLERY_CATEGORIES } from '@/services/galleryService';

interface GalleryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentImage: GalleryItem | null;
  newCaption: string;
  onCaptionChange: (caption: string) => void;
  newCategory: GalleryCategory;
  onCategoryChange: (category: GalleryCategory) => void;
  onSave: () => void;
}

export const GalleryEditDialog: React.FC<GalleryEditDialogProps> = ({
  open,
  onOpenChange,
  currentImage,
  newCaption,
  onCaptionChange,
  newCategory,
  onCategoryChange,
  onSave,
}) => {
  const editCategories = GALLERY_CATEGORIES.filter(c => c.value !== 'all');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
          <DialogDescription>
            Update the caption and category for this image
          </DialogDescription>
        </DialogHeader>
        
        {currentImage && (
          <div className="space-y-4 py-4">
            <div className="mx-auto w-full max-w-xs aspect-video overflow-hidden rounded-md bg-muted border">
              <img 
                src={currentImage.public_url} 
                alt={currentImage.caption}
                className="h-full w-full object-contain"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-caption">Caption</Label>
              <Input
                id="edit-caption"
                value={newCaption}
                onChange={(e) => onCaptionChange(e.target.value)}
                placeholder="Enter caption"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={newCategory} onValueChange={(v) => onCategoryChange(v as GalleryCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {editCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
