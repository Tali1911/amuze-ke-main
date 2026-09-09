
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { ContentItem } from '@/services/contentService';

interface ContentItemEditorProps {
  editingItem: ContentItem;
  formData: {
    title: string;
    content: string;
    content_type: 'text' | 'html' | 'markdown';
    status: 'draft' | 'published' | 'scheduled';
    meta_title: string;
    meta_description: string;
  };
  onFormDataChange: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ContentItemEditor: React.FC<ContentItemEditorProps> = ({
  editingItem,
  formData,
  onFormDataChange,
  onSave,
  onCancel
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Editing: {editingItem.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="content-title">Title</Label>
              <Input
                id="content-title"
                value={formData.title}
                onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
                placeholder="Content title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => onFormDataChange({ ...formData, status: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-text">Content</Label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => onFormDataChange({ ...formData, content: value })}
              placeholder="Enter your content here..."
              height={300}
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">SEO Settings</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meta-title">Meta Title</Label>
                <Input
                  id="meta-title"
                  value={formData.meta_title}
                  onChange={(e) => onFormDataChange({ ...formData, meta_title: e.target.value })}
                  placeholder="SEO title for search engines"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta-description">Meta Description</Label>
                <Input
                  id="meta-description"
                  value={formData.meta_description}
                  onChange={(e) => onFormDataChange({ ...formData, meta_description: e.target.value })}
                  placeholder="SEO description for search engines"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={onSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentItemEditor;
