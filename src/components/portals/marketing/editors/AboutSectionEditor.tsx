import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cmsService, ContentItem } from '@/services/cmsService';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import FieldLabel from './shared/FieldLabel';
import { TypographyStyle } from '@/lib/typography';

interface AboutSectionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  item?: ContentItem | null;
}

const sectionTypes = [
  { value: 'intro', label: 'Introduction', icon: 'FileText' },
  { value: 'purpose', label: 'Our Purpose', icon: 'Target' },
  { value: 'mission', label: 'Our Mission', icon: 'Eye' },
  { value: 'vision', label: 'Our Vision', icon: 'Heart' },
  { value: 'values', label: 'Our Values', icon: 'CheckCircle' },
  { value: 'pillar', label: 'Pillar', icon: 'Star' },
  { value: 'custom', label: 'Custom Section (Advanced)', icon: 'Layout' },
];

const AboutSectionEditor: React.FC<AboutSectionEditorProps> = ({ isOpen, onClose, onSave, item }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    sectionType: 'purpose',
    icon: 'Target',
    order: 1,
    // Custom section fields
    eyebrow: '',
    subtitle: '',
    subtitle_2: '',
    background_color: '#ffffff',
    image_url: '',
    image_alignment: 'left' as 'left' | 'right' | 'center',
  });
  const [typography, setTypography] = useState<Record<string, TypographyStyle | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        content: item.content || '',
        sectionType: item.metadata?.section_type || 'purpose',
        icon: item.metadata?.icon || 'Target',
        order: item.metadata?.order || 1,
        eyebrow: item.metadata?.eyebrow || '',
        subtitle: item.metadata?.subtitle || '',
        subtitle_2: item.metadata?.subtitle_2 || '',
        background_color: item.metadata?.background_color || '#ffffff',
        image_url: item.metadata?.image_url || '',
        image_alignment: item.metadata?.image_alignment || 'left',
      });
      setTypography(item.metadata?.typography || {});
    } else {
      setFormData({
        title: '',
        content: '',
        sectionType: 'custom',
        icon: 'Layout',
        order: 1,
        eyebrow: '',
        subtitle: '',
        subtitle_2: '',
        background_color: '#ffffff',
        image_url: '',
        image_alignment: 'left',
      });
      setTypography({});
    }
  }, [item, isOpen]);

  const setFieldTypography = (key: string) => (v: TypographyStyle | undefined) => {
    setTypography(prev => {
      const next = { ...prev };
      if (v) next[key] = v; else delete next[key];
      return next;
    });
  };

  const isCustom = formData.sectionType === 'custom';

  const handleSectionTypeChange = (value: string) => {
    const section = sectionTypes.find((s) => s.value === value);
    setFormData({
      ...formData,
      sectionType: value,
      icon: section?.icon || 'Target',
      title: value === 'custom' ? formData.title : section?.label || '',
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `about/${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('content-images').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('content-images').getPublicUrl(path);
      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: 'Image uploaded' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const baseSlug = isCustom
        ? `about-custom-${(formData.title || 'section')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}-${item?.id ? item.id.slice(0, 6) : Date.now()}`
        : `about-${formData.sectionType}`;

      const metadata: Record<string, any> = {
        section_type: formData.sectionType,
        icon: formData.icon,
        order: formData.order,
        typography,
      };
      if (isCustom) {
        metadata.eyebrow = formData.eyebrow;
        metadata.subtitle = formData.subtitle;
        metadata.subtitle_2 = formData.subtitle_2;
        metadata.background_color = formData.background_color;
        metadata.image_url = formData.image_url;
        metadata.image_alignment = formData.image_alignment;
      }

      const contentData = {
        title: formData.title,
        slug: item?.slug || baseSlug,
        content: formData.content,
        content_type: 'about_section' as const,
        status: 'published' as const,
        metadata,
      };

      if (item?.id) {
        await cmsService.updateContent(item.id, contentData);
        toast({ title: 'About section updated' });
      } else {
        await cmsService.createContent(contentData);
        toast({ title: 'About section created' });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving about section:', error);
      toast({
        title: 'Error saving about section',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit' : 'Create'} About Section</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="sectionType">Section Type</Label>
            <Select value={formData.sectionType} onValueChange={handleSectionTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sectionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCustom && (
            <div>
              <FieldLabel
                htmlFor="eyebrow"
                typography={typography.eyebrow}
                onTypographyChange={setFieldTypography('eyebrow')}
              >
                Eyebrow / Tag Label (optional)
              </FieldLabel>
              <Input
                id="eyebrow"
                value={formData.eyebrow}
                placeholder="e.g. WHY IT MATTERS"
                onChange={(e) => setFormData({ ...formData, eyebrow: e.target.value })}
              />
            </div>
          )}

          <div>
            <FieldLabel
              htmlFor="title"
              typography={typography.title}
              onTypographyChange={setFieldTypography('title')}
            >
              Title
            </FieldLabel>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {isCustom && (
            <>
              <div>
                <FieldLabel
                  htmlFor="subtitle"
                  typography={typography.subtitle}
                  onTypographyChange={setFieldTypography('subtitle')}
                >
                  Subtitle 1 (optional)
                </FieldLabel>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>
              <div>
                <FieldLabel
                  htmlFor="subtitle_2"
                  typography={typography.subtitle_2}
                  onTypographyChange={setFieldTypography('subtitle_2')}
                >
                  Subtitle 2 (optional)
                </FieldLabel>
                <Input
                  id="subtitle_2"
                  value={formData.subtitle_2}
                  onChange={(e) => setFormData({ ...formData, subtitle_2: e.target.value })}
                />
              </div>
            </>
          )}

          <div>
            <FieldLabel
              htmlFor="content"
              typography={typography.body}
              onTypographyChange={setFieldTypography('body')}
            >
              Body Content
            </FieldLabel>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              required={!isCustom}
            />
          </div>

          {isCustom && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="background_color"
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="image_alignment">Image Alignment</Label>
                  <Select
                    value={formData.image_alignment}
                    onValueChange={(v: 'left' | 'right' | 'center') =>
                      setFormData({ ...formData, image_alignment: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="center">Center (below text)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Section Image (optional)</Label>
                <div className="flex items-center gap-3 mt-2">
                  {formData.image_url ? (
                    <div className="relative">
                      <img
                        src={formData.image_url}
                        alt="preview"
                        className="w-24 h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        aria-label="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload size={14} className="mr-1" />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="Or paste an image URL"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              min="1"
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AboutSectionEditor;
