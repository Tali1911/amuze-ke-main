import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { cmsService } from '@/services/cmsService';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Eye, EyeOff } from 'lucide-react';
import { auditLogService } from '@/services/auditLogService';

interface Program {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  icon: string;
  ageRange: string;
  duration: string;
  highlights: string[];
  order: number;
  visible: boolean;
}

interface ProgramEditorProps {
  isOpen: boolean;
  onClose: () => void;
  program?: any; // ContentItem from CMS
  onSave: () => void;
}

export const ProgramEditor: React.FC<ProgramEditorProps> = ({ isOpen, onClose, program, onSave }) => {
  const [formData, setFormData] = useState<Program>({
    title: program?.title || '',
    description: program?.content || '',
    imageUrl: program?.metadata?.imageUrl || '',
    icon: program?.metadata?.icon || 'GraduationCap',
    ageRange: program?.metadata?.ageRange || '',
    duration: program?.metadata?.duration || '',
    highlights: Array.isArray(program?.metadata?.highlights) ? program.metadata.highlights : [],
    order: program?.metadata?.order || 1,
    visible: program?.metadata?.visible ?? true // Default to visible
  });
  const [highlightInput, setHighlightInput] = useState('');
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
        description: 'Please convert to JPG or PNG first. HEIC images cannot be displayed on websites.',
        variant: 'destructive'
      });
      return;
    }

    // Validate file type
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
      const filePath = `program-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, imageUrl: publicUrl });
      
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

  const addHighlight = () => {
    if (highlightInput.trim()) {
      const currentHighlights = Array.isArray(formData.highlights) ? formData.highlights : [];
      setFormData({ ...formData, highlights: [...currentHighlights, highlightInput.trim()] });
      setHighlightInput('');
    }
  };

  const removeHighlight = (index: number) => {
    const currentHighlights = Array.isArray(formData.highlights) ? formData.highlights : [];
    setFormData({ ...formData, highlights: currentHighlights.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const slug = formData.title.toLowerCase().replace(/\s+/g, '-');
      
      if (program?.id) {
        await cmsService.updateContent(program.id, {
          title: formData.title,
          slug,
          content: formData.description,
          metadata: {
            imageUrl: formData.imageUrl,
            icon: formData.icon,
            ageRange: formData.ageRange,
            duration: formData.duration,
            highlights: formData.highlights,
            order: formData.order,
            visible: formData.visible
          }
        });
        
        await auditLogService.logContentUpdated('program', program.id, formData.title);
        toast({ title: 'Program updated successfully' });
      } else {
        const result = await cmsService.createContent({
          title: formData.title,
          slug,
          content: formData.description,
          content_type: 'program',
          status: 'draft',
          metadata: {
            imageUrl: formData.imageUrl,
            icon: formData.icon,
            ageRange: formData.ageRange,
            duration: formData.duration,
            highlights: formData.highlights,
            order: formData.order,
            visible: formData.visible
          }
        });
        
        await auditLogService.logContentCreated('program', result?.id || 'new', formData.title);
        toast({ title: 'Program created successfully' });
      }
      onSave();
      onClose();
    } catch (error) {
      toast({ title: 'Error saving program', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{program ? 'Edit Program' : 'Create Program'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Program Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
              required
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
              Upload JPG, PNG, GIF, or WebP (max 5MB). HEIC not supported.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ageRange">Age Range</Label>
              <Input
                id="ageRange"
                value={formData.ageRange}
                onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                placeholder="e.g., 4-17 years"
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="e.g., 1 day - 4 weeks"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="icon">Icon Name (Lucide)</Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="GraduationCap, Baby, Mountain, etc."
            />
          </div>
          <div>
            <Label>Program Highlights</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                placeholder="Add a highlight"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
              />
              <Button type="button" onClick={addHighlight}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(formData.highlights) ? formData.highlights : []).map((highlight, index) => (
                <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {highlight}
                  <button type="button" onClick={() => removeHighlight(index)} className="hover:text-destructive">×</button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
              min="1"
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-3">
              {formData.visible ? (
                <Eye className="h-5 w-5 text-green-600" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="visible" className="text-base font-medium cursor-pointer">
                  Show on Website
                </Label>
                <p className="text-sm text-muted-foreground">
                  {formData.visible 
                    ? 'This program is visible in the "Choose Your Adventure" section' 
                    : 'This program is hidden from public view'}
                </p>
              </div>
            </div>
            <Switch
              id="visible"
              checked={formData.visible}
              onCheckedChange={(checked) => setFormData({ ...formData, visible: checked })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Program'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
