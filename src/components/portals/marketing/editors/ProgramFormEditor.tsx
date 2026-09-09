import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cmsService } from '@/services/cmsService';

interface ProgramFormEditorProps {
  isOpen: boolean;
  onClose: () => void;
  formSlug: string | null;
  onSave: () => void;
}

export const ProgramFormEditor: React.FC<ProgramFormEditorProps> = ({ isOpen, onClose, formSlug, onSave }) => {
  const [formData, setFormData] = useState({
    programInfo: {
      title: '',
      subtitle: '',
      description: '',
      ageRange: ''
    },
    fields: {} as any,
    buttons: {
      submit: 'Submit',
      back: 'Back'
    },
    messages: {
      successMessage: 'Submitted successfully!',
      errorMessage: 'Failed to submit. Please try again.',
      loadingMessage: 'Submitting...'
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (formSlug && isOpen) {
      loadFormData();
    }
  }, [formSlug, isOpen]);

  const loadFormData = async () => {
    if (!formSlug) return;
    
    const data = await cmsService.getProgramFormConfig(formSlug.replace('-form', ''));
    if (data?.metadata?.formConfig) {
      setFormData(data.metadata.formConfig);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formType = formSlug?.replace('-form', '') || '';
      const result = await cmsService.updateProgramFormConfig(formType, formData);
      
      if (result) {
        toast.success('Program form updated successfully');
        onSave();
        onClose();
        // Force page reload to fetch fresh data from database
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error('Failed to update program form - please check permissions');
      }
    } catch (error) {
      console.error('Error saving program form:', error);
      toast.error('Failed to update program form');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (fieldKey: string, property: string, value: any) => {
    setFormData({
      ...formData,
      fields: {
        ...formData.fields,
        [fieldKey]: {
          ...formData.fields[fieldKey],
          [property]: value
        }
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Program Form Configuration</DialogTitle>
          <DialogDescription>Customize all form labels, content, and messages</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info">Program Info</TabsTrigger>
              <TabsTrigger value="fields">Field Labels</TabsTrigger>
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="title">Program Title</Label>
                <Input
                  id="title"
                  value={formData.programInfo.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    programInfo: { ...formData.programInfo, title: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.programInfo.subtitle}
                  onChange={(e) => setFormData({
                    ...formData,
                    programInfo: { ...formData.programInfo, subtitle: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.programInfo.description}
                  onChange={(e) => setFormData({
                    ...formData,
                    programInfo: { ...formData.programInfo, description: e.target.value }
                  })}
                  rows={4}
                />
              </div>
              {formData.programInfo.ageRange !== undefined && (
                <div>
                  <Label htmlFor="ageRange">Age Range (Optional)</Label>
                  <Input
                    id="ageRange"
                    value={formData.programInfo.ageRange}
                    onChange={(e) => setFormData({
                      ...formData,
                      programInfo: { ...formData.programInfo, ageRange: e.target.value }
                    })}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="fields" className="space-y-4 pt-4">
              {Object.entries(formData.fields).map(([key, field]: [string, any]) => (
                <div key={key} className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${key}-label`}>Label</Label>
                      <Input
                        id={`${key}-label`}
                        value={field.label || ''}
                        onChange={(e) => updateField(key, 'label', e.target.value)}
                      />
                    </div>
                    {field.placeholder !== undefined && (
                      <div>
                        <Label htmlFor={`${key}-placeholder`}>Placeholder</Label>
                        <Input
                          id={`${key}-placeholder`}
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(key, 'placeholder', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  {field.helpText !== undefined && (
                    <div>
                      <Label htmlFor={`${key}-help`}>Help Text</Label>
                      <Input
                        id={`${key}-help`}
                        value={field.helpText || ''}
                        onChange={(e) => updateField(key, 'helpText', e.target.value)}
                      />
                    </div>
                  )}
                  {field.description !== undefined && (
                    <div>
                      <Label htmlFor={`${key}-description`}>Description</Label>
                      <Input
                        id={`${key}-description`}
                        value={field.description || ''}
                        onChange={(e) => updateField(key, 'description', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="buttons" className="space-y-4 pt-4">
              {Object.entries(formData.buttons).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={`btn-${key}`} className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <Input
                    id={`btn-${key}`}
                    value={value as string}
                    onChange={(e) => setFormData({
                      ...formData,
                      buttons: { ...formData.buttons, [key]: e.target.value }
                    })}
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="messages" className="space-y-4 pt-4">
              {Object.entries(formData.messages).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={`msg-${key}`} className="capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <Textarea
                    id={`msg-${key}`}
                    value={value as string}
                    onChange={(e) => setFormData({
                      ...formData,
                      messages: { ...formData.messages, [key]: e.target.value }
                    })}
                    rows={2}
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
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
