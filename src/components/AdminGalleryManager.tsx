import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { GalleryUploadForm } from './gallery/GalleryUploadForm';
import { GalleryGrid } from './gallery/GalleryGrid';
import { GalleryEditDialog } from './gallery/GalleryEditDialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { 
  galleryService, 
  GalleryItem, 
  GalleryCategory 
} from '@/services/galleryService';

interface AdminGalleryManagerProps {
  currentAdminUsername: string;
}

const AdminGalleryManager: React.FC<AdminGalleryManagerProps> = ({ currentAdminUsername }) => {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<GalleryItem | null>(null);
  const [newCaption, setNewCaption] = useState<string>('');
  const [newCategory, setNewCategory] = useState<GalleryCategory>('all');

  useEffect(() => {
    loadGalleryImages();
  }, []);

  const loadGalleryImages = async () => {
    try {
      const items = await galleryService.getAllItems();
      setImages(items);
    } catch (error) {
      console.error('Error loading gallery images:', error);
      toast({
        title: 'Failed to load images',
        description: 'Could not load gallery images. You may need to run the migration first.',
        variant: 'destructive'
      });
    }
  };

  const handleMigrateExisting = async () => {
    setIsMigrating(true);
    try {
      const count = await galleryService.migrateExistingImages();
      await loadGalleryImages();
      toast({
        title: 'Migration complete',
        description: `Migrated ${count} existing images to the new system.`
      });
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: 'Migration failed',
        description: 'Could not migrate existing images. Please ensure the database migration has been applied.',
        variant: 'destructive'
      });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleUpload = async (file: File, caption: string, category: GalleryCategory) => {
    setIsUploading(true);

    try {
      // Check for HEIC/HEIF files
      const lowerFileName = file.name.toLowerCase();
      if (lowerFileName.endsWith('.heic') || lowerFileName.endsWith('.heif')) {
        toast({
          title: 'HEIC format not supported',
          description: 'Please convert to JPG or PNG first.',
          variant: 'destructive'
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          variant: 'destructive'
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 5MB',
          variant: 'destructive'
        });
        return;
      }

      await galleryService.uploadAndCreate(file, caption, category);
      await loadGalleryImages();
      
      toast({
        title: "Gallery image added",
        description: `Image added to ${category} category`,
      });

      console.log(`Admin ${currentAdminUsername} added gallery image in category: ${category}`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, storagePath: string) => {
    if (window.confirm('Are you sure you want to delete this gallery image?')) {
      try {
        await galleryService.deleteItem(id, storagePath);
        await loadGalleryImages();
        
        toast({
          title: "Image deleted",
          description: "The image has been removed from the gallery",
        });

        console.log(`Admin ${currentAdminUsername} deleted gallery image: ${id}`);
      } catch (error) {
        console.error('Error deleting image:', error);
        toast({
          title: "Delete failed",
          description: "Could not delete the image",
          variant: "destructive"
        });
      }
    }
  };

  const handleCategoryChange = async (id: string, category: GalleryCategory) => {
    try {
      await galleryService.updateItem(id, { category });
      setImages(prev => prev.map(img => 
        img.id === id ? { ...img, category } : img
      ));
      toast({
        title: "Category updated",
        description: "Image category has been changed"
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "Update failed",
        description: "Could not update the category",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (image: GalleryItem) => {
    setCurrentImage(image);
    setNewCaption(image.caption);
    setNewCategory(image.category);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentImage) return;

    try {
      await galleryService.updateItem(currentImage.id, {
        caption: newCaption,
        category: newCategory
      });
      
      setImages(prev => prev.map(img => 
        img.id === currentImage.id 
          ? { ...img, caption: newCaption, category: newCategory } 
          : img
      ));
      
      setEditDialogOpen(false);
      
      toast({
        title: "Image updated",
        description: "Caption and category updated successfully",
      });

      console.log(`Admin ${currentAdminUsername} updated gallery image: ${currentImage.id}`);
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Update failed",
        description: "Could not update the image",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={handleMigrateExisting}
          disabled={isMigrating}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isMigrating ? 'animate-spin' : ''}`} />
          {isMigrating ? 'Migrating...' : 'Migrate Existing Images'}
        </Button>
      </div>

      <GalleryUploadForm 
        onUpload={handleUpload} 
        isUploading={isUploading} 
      />

      <GalleryGrid 
        galleryImages={images} 
        onEdit={openEditDialog} 
        onDelete={handleDelete}
        onCategoryChange={handleCategoryChange}
      />

      <GalleryEditDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentImage={currentImage}
        newCaption={newCaption}
        onCaptionChange={setNewCaption}
        newCategory={newCategory}
        onCategoryChange={setNewCategory}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default AdminGalleryManager;
