import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cmsService } from '@/services/cmsService';
import { Upload, Plus, Trash2, Instagram, Twitter, Facebook, Linkedin, Youtube } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

interface SiteSettingsEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'Twitter / X', icon: Twitter },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'tiktok', label: 'TikTok', icon: null },
  { value: 'whatsapp', label: 'WhatsApp', icon: null },
];

export const SiteSettingsEditor: React.FC<SiteSettingsEditorProps> = ({ isOpen, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [formData, setFormData] = useState({
    footer_description: '',
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    contact_hours: '',
    copyright_text: '',
    schedule_url: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const settings = await cmsService.getSiteSettings();
    if (settings?.metadata) {
      const { social_links, social_instagram, social_twitter, social_facebook, ...rest } = settings.metadata;
      setFormData(prev => ({ ...prev, ...rest }));
      
      // Load social links - support both new format and legacy format
      if (social_links && Array.isArray(social_links)) {
        setSocialLinks(social_links);
      } else {
        // Convert legacy format to new format
        const legacyLinks: SocialLink[] = [];
        if (social_instagram) {
          legacyLinks.push({ id: crypto.randomUUID(), platform: 'instagram', url: social_instagram });
        }
        if (social_twitter) {
          legacyLinks.push({ id: crypto.randomUUID(), platform: 'twitter', url: social_twitter });
        }
        if (social_facebook) {
          legacyLinks.push({ id: crypto.randomUUID(), platform: 'facebook', url: social_facebook });
        }
        setSocialLinks(legacyLinks.length > 0 ? legacyLinks : []);
      }
    }
  };

  const handleAddSocialLink = () => {
    setSocialLinks(prev => [...prev, { id: crypto.randomUUID(), platform: 'instagram', url: '' }]);
  };

  const handleRemoveSocialLink = (id: string) => {
    setSocialLinks(prev => prev.filter(link => link.id !== id));
  };

  const handleUpdateSocialLink = (id: string, field: 'platform' | 'url', value: string) => {
    setSocialLinks(prev => prev.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const handleScheduleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only for schedules)
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `schedule-${Date.now()}.${fileExt}`;
      const filePath = `schedules/${fileName}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, schedule_url: publicUrl }));
      
      toast({ title: 'Schedule uploaded successfully' });
    } catch (error) {
      console.error('Error uploading schedule:', error);
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading the schedule',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const settings = await cmsService.getSiteSettings();
      const metadata = {
        ...formData,
        social_links: socialLinks
      };
      
      if (settings) {
        await cmsService.updateContent(settings.id, {
          metadata,
          status: 'published'
        });
      } else {
        await cmsService.createContent({
          title: 'Site Settings',
          slug: 'site-settings',
          content_type: 'site_settings',
          status: 'published',
          metadata
        });
      }

      toast({ title: 'Site settings updated successfully' });
      onSave();
      onClose();
    } catch (error) {
      toast({ title: 'Error updating site settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformConfig = SOCIAL_PLATFORMS.find(p => p.value === platform);
    return platformConfig?.icon;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Site Settings</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Footer Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="footer_description">Footer Description</Label>
                <Textarea
                  id="footer_description"
                  value={formData.footer_description}
                  onChange={(e) => setFormData({ ...formData, footer_description: e.target.value })}
                  placeholder="Forest adventures and outdoor education..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact_phone">Phone Number</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="0114 705 763"
                />
              </div>
              <div>
                <Label htmlFor="contact_email">Email Address</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="info@amusekenya.co.ke"
                />
              </div>
              <div>
                <Label htmlFor="contact_address">Address</Label>
                <Textarea
                  id="contact_address"
                  value={formData.contact_address}
                  onChange={(e) => setFormData({ ...formData, contact_address: e.target.value })}
                  placeholder="Karura Forest, Gate F, Thigiri Ridge"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="contact_hours">Operating Hours</Label>
                <Input
                  id="contact_hours"
                  value={formData.contact_hours}
                  onChange={(e) => setFormData({ ...formData, contact_hours: e.target.value })}
                  placeholder="Monday to Sunday: 08:00am - 05:00pm"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Social Media Links</h3>
              <Button type="button" variant="outline" size="sm" onClick={handleAddSocialLink}>
                <Plus className="h-4 w-4 mr-2" />
                Add Platform
              </Button>
            </div>
            
            {socialLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                No social media links added. Click "Add Platform" to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {socialLinks.map((link) => {
                  const IconComponent = getPlatformIcon(link.platform);
                  return (
                    <div key={link.id} className="flex gap-2 items-center">
                      <Select
                        value={link.platform}
                        onValueChange={(value) => handleUpdateSocialLink(link.id, 'platform', value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOCIAL_PLATFORMS.map((platform) => (
                            <SelectItem key={platform.value} value={platform.value}>
                              <div className="flex items-center gap-2">
                                {platform.icon && <platform.icon className="h-4 w-4" />}
                                {platform.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        className="flex-1"
                        value={link.url}
                        onChange={(e) => handleUpdateSocialLink(link.id, 'url', e.target.value)}
                        placeholder={`https://${link.platform}.com/...`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSocialLink(link.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="copyright_text">Copyright Text (Optional)</Label>
            <Input
              id="copyright_text"
              value={formData.copyright_text}
              onChange={(e) => setFormData({ ...formData, copyright_text: e.target.value })}
              placeholder="Amuse Kenya. All rights reserved."
            />
          </div>

          <div>
            <h3 className="font-semibold mb-4">Program Schedules</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="schedule_url">Schedule Document (PDF)</Label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      id="schedule_url"
                      value={formData.schedule_url}
                      onChange={(e) => setFormData({ ...formData, schedule_url: e.target.value })}
                      placeholder="https://... or upload a file"
                    />
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleScheduleUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload PDF'}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a PDF schedule document (max 10MB) that users can download from the navbar
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
