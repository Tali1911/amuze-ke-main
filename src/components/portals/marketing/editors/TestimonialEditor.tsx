import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { cmsService, ContentItem } from '@/services/cmsService';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TestimonialEditorProps {
  isOpen: boolean;
  onClose: () => void;
  testimonial?: ContentItem | null;
  onSave: () => void;
}

export const TestimonialEditor: React.FC<TestimonialEditorProps> = ({ 
  isOpen, 
  onClose, 
  testimonial, 
  onSave 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    quote: '',
    author_name: '',
    author_role: '',
    avatar_url: '',
    order: 0
  });

  useEffect(() => {
    if (testimonial?.metadata) {
      setFormData({
        quote: testimonial.content || '',
        author_name: testimonial.metadata.author_name || '',
        author_role: testimonial.metadata.author_role || '',
        avatar_url: testimonial.metadata.avatar_url || '',
        order: testimonial.metadata.order || 0
      });
    } else {
      setFormData({
        quote: '',
        author_name: '',
        author_role: '',
        avatar_url: '',
        order: 0
      });
    }
  }, [testimonial]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check for HEIC/HEIF files (not web-compatible)
    const fileName = file.name.toLowerCase();
    const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif');
    
    if (isHeic) {
      toast({ title: 'HEIC format not supported. Convert to JPG or PNG first.', variant: 'destructive' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image size must be less than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `testimonials/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, avatar_url: publicUrl });
      toast({ title: 'Image uploaded successfully' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const slug = formData.author_name.toLowerCase().replace(/\s+/g, '-');
      
      if (testimonial) {
        await cmsService.updateContent(testimonial.id, {
          title: `Testimonial from ${formData.author_name}`,
          content: formData.quote,
          metadata: {
            author_name: formData.author_name,
            author_role: formData.author_role,
            avatar_url: formData.avatar_url,
            order: formData.order
          }
        });
        toast({ title: 'Testimonial updated successfully' });
      } else {
        await cmsService.createContent({
          title: `Testimonial from ${formData.author_name}`,
          slug: `testimonial-${slug}`,
          content: formData.quote,
          content_type: 'testimonial',
          status: 'published',
          metadata: {
            author_name: formData.author_name,
            author_role: formData.author_role,
            avatar_url: formData.avatar_url,
            order: formData.order
          }
        });
        toast({ title: 'Testimonial created successfully' });
      }

      onSave();
      onClose();
    } catch (error) {
      toast({ title: 'Error saving testimonial', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{testimonial ? 'Edit' : 'Add'} Testimonial</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="quote">Testimonial Quote *</Label>
            <Textarea
              id="quote"
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
              placeholder="My son came back from camp with newfound confidence..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="author_name">Author Name *</Label>
            <Input
              id="author_name"
              value={formData.author_name}
              onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              placeholder="Sarah Johnson"
              required
            />
          </div>

          <div>
            <Label htmlFor="author_role">Author Role/Relation *</Label>
            <Input
              id="author_role"
              value={formData.author_role}
              onChange={(e) => setFormData({ ...formData, author_role: e.target.value })}
              placeholder="Parent of Alex, 9"
              required
            />
          </div>

          <div>
            <Label htmlFor="avatar_url">Avatar Image</Label>
            <div className="space-y-2">
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload from Device'}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, GIF, WebP (max 5MB). HEIC not supported.
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lower numbers appear first
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : testimonial ? 'Update Testimonial' : 'Create Testimonial'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
