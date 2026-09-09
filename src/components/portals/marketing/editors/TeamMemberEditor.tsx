import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cmsService, ContentItem } from '@/services/cmsService';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TeamMemberEditorProps {
  isOpen: boolean;
  onClose: () => void;
  member?: ContentItem | null;
  onSave: () => void;
}

const iconOptions = [
  'User', 'Users', 'UserCircle', 'Heart', 'Star', 'Award', 'Shield', 'Target'
];

export const TeamMemberEditor: React.FC<TeamMemberEditorProps> = ({ 
  isOpen, 
  onClose, 
  member, 
  onSave 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    short_description: '',
    image_url: '',
    specialization: '',
    icon: 'User',
    order: 0
  });

  useEffect(() => {
    if (member?.metadata) {
      setFormData({
        name: member.title || '',
        role: member.metadata.role || '',
        bio: member.content || '',
        short_description: member.metadata.short_description || '',
        image_url: member.metadata.image_url || '',
        specialization: member.metadata.specialization || '',
        icon: member.metadata.icon || 'User',
        order: member.metadata.order || 0
      });
    } else {
      setFormData({
        name: '',
        role: '',
        bio: '',
        short_description: '',
        image_url: '',
        specialization: '',
        icon: 'User',
        order: 0
      });
    }
  }, [member]);

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
      const filePath = `team/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
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
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-');
      
      if (member) {
        await cmsService.updateContent(member.id, {
          title: formData.name,
          content: formData.bio,
          metadata: {
            role: formData.role,
            short_description: formData.short_description,
            image_url: formData.image_url,
            specialization: formData.specialization,
            icon: formData.icon,
            order: formData.order
          }
        });
        toast({ title: 'Team member updated successfully' });
      } else {
        await cmsService.createContent({
          title: formData.name,
          slug: `team-${slug}`,
          content: formData.bio,
          content_type: 'team_member',
          status: 'published',
          metadata: {
            role: formData.role,
            short_description: formData.short_description,
            image_url: formData.image_url,
            specialization: formData.specialization,
            icon: formData.icon,
            order: formData.order
          }
        });
        toast({ title: 'Team member created successfully' });
      }

      onSave();
      onClose();
    } catch (error) {
      toast({ title: 'Error saving team member', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit' : 'Add'} Team Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Role/Title *</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="Lead Instructor"
              required
            />
          </div>

          <div>
            <Label htmlFor="short_description">Short Description</Label>
            <Input
              id="short_description"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              placeholder="Brief tagline about this person"
            />
          </div>

          <div>
            <Label htmlFor="bio">Full Bio *</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Full biography..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="Nature Education, Rock Climbing, etc."
            />
          </div>

          <div>
            <Label htmlFor="image_url">Profile Image *</Label>
            <div className="space-y-2">
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
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
            <Label htmlFor="icon">Icon</Label>
            <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((icon) => (
                  <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : member ? 'Update Team Member' : 'Create Team Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
