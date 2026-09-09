import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cmsService } from '@/services/cmsService';
import { supabase } from '@/integrations/supabase/client';
import { Upload } from 'lucide-react';
import { auditLogService } from '@/services/auditLogService';

interface Announcement {
  id?: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  posterUrl?: string;
}

interface AnnouncementEditorProps {
  isOpen: boolean;
  onClose: () => void;
  announcement?: any; // ContentItem from CMS
  onSave: () => void;
}

export const AnnouncementEditorDialog: React.FC<AnnouncementEditorProps> = ({ isOpen, onClose, announcement, onSave }) => {
  const [formData, setFormData] = useState<Announcement>({
    title: announcement?.title || '',
    content: announcement?.content || '',
    priority: announcement?.metadata?.priority || 'medium',
    posterUrl: announcement?.metadata?.posterUrl || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check for HEIC/HEIF files (not web-compatible)
    const fileName = file.name.toLowerCase();
    const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif');
    
    if (isHeic) {
      toast({
        title: 'HEIC format not supported',
        description: 'Please convert to JPG or PNG format first. HEIC images cannot be displayed on websites.',
        variant: 'destructive'
      });
      if (event.target) event.target.value = '';
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG, GIF, WebP)',
        variant: 'destructive'
      });
      if (event.target) event.target.value = '';
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
      const filePath = `announcement-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, posterUrl: publicUrl });
      
      toast({
        title: 'Image uploaded successfully',
        description: 'Your image has been uploaded'
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
    setIsSaving(true);

    try {
      const slug = formData.title.toLowerCase().replace(/\s+/g, '-');
      
      if (announcement?.id) {
        await cmsService.updateContent(announcement.id, {
          title: formData.title,
          slug,
          content: formData.content,
          metadata: {
            priority: formData.priority,
            posterUrl: formData.posterUrl
          }
        });
        
        await auditLogService.logContentUpdated('announcement', announcement.id, formData.title);
        toast({ title: 'Announcement updated successfully' });
      } else {
        const result = await cmsService.createContent({
          title: formData.title,
          slug,
          content: formData.content,
          content_type: 'announcement',
          status: 'draft',
          metadata: {
            priority: formData.priority,
            posterUrl: formData.posterUrl
          }
        });
        
        await auditLogService.logContentCreated('announcement', result?.id || 'new', formData.title);
        toast({ title: 'Announcement created successfully' });
      }
      onSave();
      onClose();
    } catch (error) {
      toast({ title: 'Error saving announcement', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{announcement ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              required
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="posterUrl">Poster Image URL (Optional)</Label>
            <Input
              id="posterUrl"
              value={formData.posterUrl}
              onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
              placeholder="https://..."
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
              className="w-full mt-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload from Device'}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Upload JPG, PNG, GIF, or WebP (max 5MB). HEIC not supported - convert first.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Announcement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
