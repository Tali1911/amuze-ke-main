import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cmsService, ContentItem } from '@/services/cmsService';

interface ServiceItemEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  item?: ContentItem | null;
}

const iconOptions = [
  { value: 'GraduationCap', label: 'Graduation Cap' },
  { value: 'Baby', label: 'Baby' },
  { value: 'School', label: 'School' },
  { value: 'Tent', label: 'Tent/Camp' },
  { value: 'Users', label: 'Group/Users' },
  { value: 'MapPin', label: 'Location/Map' },
  { value: 'Target', label: 'Target' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Lightbulb', label: 'Lightbulb' },
  { value: 'TreePine', label: 'Tree' },
];

const ServiceItemEditor: React.FC<ServiceItemEditorProps> = ({ isOpen, onClose, onSave, item }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'GraduationCap',
    order: 1,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.content || '',
        icon: item.metadata?.icon || 'GraduationCap',
        order: item.metadata?.order || 1,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        icon: 'GraduationCap',
        order: 1,
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const contentData = {
        title: formData.title,
        slug: `service-${formData.title.toLowerCase().replace(/\s+/g, '-')}`,
        content: formData.description,
        content_type: 'service_item' as const,
        status: 'published' as const,
        metadata: {
          icon: formData.icon,
          order: formData.order,
        },
      };

      if (item?.id) {
        await cmsService.updateContent(item.id, contentData);
        toast({ title: 'Service updated successfully' });
      } else {
        await cmsService.createContent(contentData);
        toast({ title: 'Service created successfully' });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({ 
        title: 'Error saving service',
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
          <DialogTitle>{item ? 'Edit' : 'Create'} Service Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Service Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Homeschooling Outdoor Experiences"
              required
            />
          </div>

          <div>
            <Label htmlFor="icon">Icon</Label>
            <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Brief description of this service..."
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

export default ServiceItemEditor;
