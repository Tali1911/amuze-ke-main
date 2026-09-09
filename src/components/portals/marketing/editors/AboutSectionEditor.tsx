import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cmsService, ContentItem } from '@/services/cmsService';
import { Target, Eye, Heart, CheckCircle } from 'lucide-react';

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
];

const AboutSectionEditor: React.FC<AboutSectionEditorProps> = ({ isOpen, onClose, onSave, item }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    sectionType: 'purpose',
    icon: 'Target',
    order: 1,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        content: item.content || '',
        sectionType: item.metadata?.section_type || 'purpose',
        icon: item.metadata?.icon || 'Target',
        order: item.metadata?.order || 1,
      });
    } else {
      setFormData({
        title: '',
        content: '',
        sectionType: 'purpose',
        icon: 'Target',
        order: 1,
      });
    }
  }, [item, isOpen]);

  const handleSectionTypeChange = (value: string) => {
    const section = sectionTypes.find(s => s.value === value);
    setFormData({
      ...formData,
      sectionType: value,
      icon: section?.icon || 'Target',
      title: section?.label || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const contentData = {
        title: formData.title,
        slug: `about-${formData.sectionType}`,
        content: formData.content,
        content_type: 'about_section' as const,
        status: 'published' as const,
        metadata: {
          section_type: formData.sectionType,
          icon: formData.icon,
          order: formData.order,
        },
      };

      if (item?.id) {
        await cmsService.updateContent(item.id, contentData);
        toast({ title: 'About section updated successfully' });
      } else {
        await cmsService.createContent(contentData);
        toast({ title: 'About section created successfully' });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving about section:', error);
      toast({ 
        title: 'Error saving about section',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
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
                {sectionTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              rows={6}
              required
            />
          </div>

          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
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
