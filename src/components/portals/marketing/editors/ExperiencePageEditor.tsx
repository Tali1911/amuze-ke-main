import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cmsService } from '@/services/cmsService';
import MediaUploader from './MediaUploader';

interface ExperiencePageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  experienceSlug: string | null;
  onSave: () => void;
}

export const ExperiencePageEditor: React.FC<ExperiencePageEditorProps> = ({
  isOpen,
  onClose,
  experienceSlug,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mediaType: 'photo' as 'photo' | 'video',
    mediaUrl: '',
    videoThumbnail: '',
    mediaAltText: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (experienceSlug && isOpen) {
      loadExperienceData();
    }
  }, [experienceSlug, isOpen]);

  const loadExperienceData = async () => {
    if (!experienceSlug) return;

    const experienceType = experienceSlug.replace('-page', '');
    const data = await cmsService.getExperiencePageConfig(experienceType);
    
    if (data?.metadata?.pageConfig) {
      const config = data.metadata.pageConfig;
      setFormData({
        title: config.title || '',
        description: config.description || '',
        mediaType: config.mediaType || 'photo',
        mediaUrl: config.mediaUrl || '',
        videoThumbnail: config.videoThumbnail || '',
        mediaAltText: config.mediaAltText || '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const experienceType = experienceSlug?.replace('-page', '') || '';
      const result = await cmsService.updateExperiencePageConfig(experienceType, formData);

      if (result) {
        toast.success('Experience page updated successfully');
        onSave();
        onClose();
      } else {
        toast.error('Failed to update experience page');
      }
    } catch (error) {
      console.error('Error saving experience page:', error);
      toast.error('Failed to update experience page');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Experience Page Media</DialogTitle>
          <DialogDescription>Customize the featured media for this experience page</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Kenyan Experiences"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the experience..."
              rows={3}
            />
          </div>

          <MediaUploader
            mediaType={formData.mediaType}
            mediaUrl={formData.mediaUrl}
            thumbnailUrl={formData.videoThumbnail}
            onMediaTypeChange={(type) => setFormData({ ...formData, mediaType: type })}
            onMediaUrlChange={(url) => setFormData({ ...formData, mediaUrl: url })}
            onThumbnailUrlChange={(url) => setFormData({ ...formData, videoThumbnail: url })}
            storagePath="experiences"
          />

          <div>
            <Label htmlFor="mediaAltText">Alt Text (for accessibility)</Label>
            <Input
              id="mediaAltText"
              value={formData.mediaAltText}
              onChange={(e) => setFormData({ ...formData, mediaAltText: e.target.value })}
              placeholder="Describe the media for screen readers"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
