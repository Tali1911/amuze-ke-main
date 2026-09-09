import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { cmsService, ContentItem } from '@/services/cmsService';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, FileText } from 'lucide-react';
import RichTextEditor from '@/components/content/RichTextEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ActivityDetailEditorProps {
  isOpen: boolean;
  onClose: () => void;
  activityDetail?: ContentItem;
  onSave: () => Promise<void>;
  heroSlides?: ContentItem[];
}

export const ActivityDetailEditor: React.FC<ActivityDetailEditorProps> = ({ 
  isOpen, 
  onClose, 
  activityDetail, 
  onSave,
  heroSlides = []
}) => {
  const [formData, setFormData] = useState({
    title: activityDetail?.title || '',
    slug: activityDetail?.slug || '',
    content: activityDetail?.content || '',
    featuredImage: activityDetail?.metadata?.featured_image || '',
    linkedHeroSlideId: activityDetail?.metadata?.linked_hero_slide_id || '',
    metaTitle: activityDetail?.metadata?.meta_title || '',
    metaDescription: activityDetail?.metadata?.meta_description || '',
    status: (activityDetail?.status || 'published') as 'draft' | 'published'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate slug from title
  useEffect(() => {
    if (!activityDetail && formData.title) {
      const autoSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug: autoSlug }));
    }
  }, [formData.title, activityDetail]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `activity-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, featuredImage: publicUrl });
      
      toast({
        title: 'Image uploaded successfully',
        description: 'Your featured image has been uploaded'
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Failed to upload image',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug || !formData.content) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in title, slug, and content',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);

    try {
      const contentData = {
        title: formData.title,
        slug: formData.slug,
        content: formData.content,
        content_type: 'activity_detail' as const,
        status: formData.status as 'draft' | 'published',
        metadata: {
          featured_image: formData.featuredImage,
          linked_hero_slide_id: formData.linkedHeroSlideId,
          meta_title: formData.metaTitle || formData.title,
          meta_description: formData.metaDescription
        }
      };

      let result;
      if (activityDetail?.id) {
        result = await cmsService.updateContent(activityDetail.id, contentData);
        if (!result) {
          throw new Error('Failed to update activity detail. Please check your permissions.');
        }
        toast({
          title: 'Activity detail updated',
          description: 'Your changes have been saved successfully'
        });
      } else {
        result = await cmsService.createContent(contentData);
        if (!result) {
          throw new Error('Failed to create activity detail. This slug may already exist or you may not have permission.');
        }
        toast({
          title: 'Activity detail created',
          description: 'Your activity detail page has been created'
        });
      }

      // Call onSave which will refresh the list and close the dialog
      await onSave();
    } catch (error: any) {
      console.error('Error saving activity detail:', error);
      toast({
        title: 'Failed to save',
        description: error?.message || 'There was an error saving your activity detail. Please try a different slug or check your permissions.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {activityDetail ? 'Edit Activity Detail Page' : 'Create Activity Detail Page'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Activity Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Mountain Biking Adventure"
              required
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="mountain-biking-adventure"
              required
            />
            <p className="text-sm text-muted-foreground">
              URL: /activity/{formData.slug || 'your-slug'}
            </p>
          </div>

          {/* Link to Hero Slide */}
          <div className="space-y-2">
            <Label htmlFor="linkedHeroSlide">Link to Hero Slide (Optional)</Label>
            <Select
              value={formData.linkedHeroSlideId}
              onValueChange={(value) => setFormData({ ...formData, linkedHeroSlideId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a hero slide" />
              </SelectTrigger>
              <SelectContent>
                {heroSlides.map((slide) => (
                  <SelectItem key={slide.id} value={slide.id}>
                    {slide.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Featured Image */}
          <div className="space-y-2">
            <Label>Featured Image</Label>
            {formData.featuredImage ? (
              <div className="relative">
                <img 
                  src={formData.featuredImage} 
                  alt="Featured" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setFormData({ ...formData, featuredImage: '' })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload Featured Image'}
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Content Editor */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
          <RichTextEditor
            value={formData.content}
            onChange={(value) => setFormData({ ...formData, content: value })}
          />
          </div>

          {/* SEO Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <h3 className="font-semibold">SEO Settings</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder="Leave blank to use activity title"
                maxLength={60}
              />
              <p className="text-sm text-muted-foreground">
                {formData.metaTitle.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="Brief description for search engines"
                maxLength={160}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                {formData.metaDescription.length}/160 characters
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as 'draft' | 'published' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : activityDetail ? 'Update' : 'Create'} Activity Detail
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
