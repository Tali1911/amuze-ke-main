import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageIcon, Upload } from 'lucide-react';
import { GalleryCategory, GALLERY_CATEGORIES } from '@/services/galleryService';

interface GalleryUploadFormProps {
  onUpload: (file: File, caption: string, category: GalleryCategory) => void;
  isUploading: boolean;
}

export const GalleryUploadForm: React.FC<GalleryUploadFormProps> = ({ onUpload, isUploading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageCaption, setImageCaption] = useState<string>('');
  const [category, setCategory] = useState<GalleryCategory>('all');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile, imageCaption || selectedFile.name, category);
      setSelectedFile(null);
      setImageCaption('');
      setCategory('all');
    }
  };

  // Filter out 'all' for upload - it's only for filtering
  const uploadCategories = GALLERY_CATEGORIES.filter(c => c.value !== 'all');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gallery Management</CardTitle>
        <CardDescription>
          Upload images with categories for easy filtering on the public gallery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gallery-upload">Select Image</Label>
                <Input 
                  id="gallery-upload" 
                  type="file" 
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF, WebP supported. HEIC not supported - convert first.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image-caption">Caption</Label>
                <Input
                  id="image-caption"
                  placeholder="Enter a caption for this image"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as GalleryCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {uploadCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Category helps visitors filter images on the public gallery
                </p>
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={isUploading || !selectedFile}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Add to Gallery"}
              </Button>
            </div>
            
            <div className="border rounded-md p-4">
              {selectedFile ? (
                <div className="aspect-square flex items-center justify-center overflow-hidden rounded-md bg-muted">
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Preview" 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-square flex flex-col items-center justify-center rounded-md border border-dashed text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mb-2" />
                  <span className="text-sm">Image preview will appear here</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
