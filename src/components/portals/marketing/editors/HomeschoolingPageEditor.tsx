import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cmsService } from '@/services/cmsService';
import { supabase } from '@/integrations/supabase/client';
import MediaUploader from './MediaUploader';

interface HomeschoolingPackage {
  id: string;
  name: string;
  frequency: string;
  price: string;
  description: string;
  features: string[];
}

interface HomeschoolingConfig {
  title: string;
  subtitle: string;
  description: string;
  featuredImage: string;
  packages: HomeschoolingPackage[];
  activities: string[];
  whatsIncluded: string[];
  formConfig: {
    fields: Record<string, { label: string; placeholder?: string; helpText?: string }>;
    buttons: Record<string, string>;
    messages: Record<string, string>;
  };
  metaTitle: string;
  metaDescription: string;
}

interface HomeschoolingPageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
}

const defaultPackages: HomeschoolingPackage[] = [
  {
    id: 'explorer',
    name: 'Explorer Package',
    frequency: '1 session/week',
    price: 'KES 8,000/month',
    description: 'Perfect for families wanting regular outdoor learning.',
    features: ['Weekly 3-hour sessions', 'Nature journaling', 'Basic bushcraft', 'Group activities']
  },
  {
    id: 'adventurer',
    name: 'Adventurer Package',
    frequency: '2 sessions/week',
    price: 'KES 14,000/month',
    description: 'Deeper immersion in nature-based education.',
    features: ['Twice weekly sessions', 'Advanced skills', 'Personal mentoring', 'Portfolio building']
  }
];

const defaultConfig: HomeschoolingConfig = {
  title: 'Homeschooling Programs',
  subtitle: '(Ages 4-16 years)',
  description: 'Enhance your homeschool curriculum with structured outdoor learning.',
  featuredImage: '',
  packages: defaultPackages,
  activities: ['Nature Skills', 'Wildlife Study', 'Adventure Activities', 'Creative Arts'],
  whatsIncluded: ['Qualified facilitators', 'All materials', 'Nature journals', 'Progress reports'],
  formConfig: {
    fields: {
      parentName: { label: 'Parent/Guardian Name', placeholder: 'Your full name' },
      childName: { label: 'Child\'s Name', placeholder: 'Child\'s name' },
      package: { label: 'Preferred Package', placeholder: 'Select a package' },
      email: { label: 'Email Address', placeholder: 'Your email' },
      phone: { label: 'Phone Number', placeholder: 'Contact number' }
    },
    buttons: { submit: 'Enroll Now', back: 'Back to Programs' },
    messages: {
      successMessage: 'Enrollment submitted successfully!',
      errorMessage: 'Failed to submit. Please try again.',
      loadingMessage: 'Processing...'
    }
  },
  metaTitle: 'Homeschooling Programs | Amuse Kenya',
  metaDescription: 'Nature-based homeschool programs in Nairobi.'
};

export const HomeschoolingPageEditor: React.FC<HomeschoolingPageEditorProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [config, setConfig] = useState<HomeschoolingConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) loadConfig();
  }, [isOpen]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const content = await cmsService.getContentBySlug('homeschooling-page', 'experience_page');
      if (content?.metadata?.pageConfig) {
        setConfig({ ...defaultConfig, ...content.metadata.pageConfig });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await cmsService.updateExperiencePageConfig('homeschooling', { pageConfig: config });
      toast.success('Homeschooling page saved successfully');
      await onSave();
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePackage = (index: number, field: keyof HomeschoolingPackage, value: any) => {
    setConfig(prev => ({
      ...prev,
      packages: prev.packages.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const addPackage = () => {
    setConfig(prev => ({
      ...prev,
      packages: [...prev.packages, {
        id: `package-${Date.now()}`,
        name: 'New Package',
        frequency: '1 session/week',
        price: 'KES 0/month',
        description: 'Package description',
        features: ['Feature 1']
      }]
    }));
  };

  const removePackage = (index: number) => {
    setConfig(prev => ({ ...prev, packages: prev.packages.filter((_, i) => i !== index) }));
  };

  const addActivity = () => {
    setConfig(prev => ({ ...prev, activities: [...prev.activities, ''] }));
  };

  const updateActivity = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      activities: prev.activities.map((a, i) => i === index ? value : a)
    }));
  };

  const removeActivity = (index: number) => {
    setConfig(prev => ({ ...prev, activities: prev.activities.filter((_, i) => i !== index) }));
  };

  const addIncludedItem = () => {
    setConfig(prev => ({ ...prev, whatsIncluded: [...prev.whatsIncluded, ''] }));
  };

  const updateIncludedItem = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      whatsIncluded: prev.whatsIncluded.map((item, i) => i === index ? value : item)
    }));
  };

  const removeIncludedItem = (index: number) => {
    setConfig(prev => ({ ...prev, whatsIncluded: prev.whatsIncluded.filter((_, i) => i !== index) }));
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent><div className="py-8 text-center">Loading...</div></DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Homeschooling Page</DialogTitle>
          <DialogDescription>Manage content for the Homeschooling registration page</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Page Content</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="form">Form Config</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Page Content</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Page Title</Label>
                  <Input value={config.title} onChange={e => setConfig({ ...config, title: e.target.value })} />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input value={config.subtitle} onChange={e => setConfig({ ...config, subtitle: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={config.description} onChange={e => setConfig({ ...config, description: e.target.value })} rows={4} />
                </div>
                <MediaUploader
                  mediaType="photo"
                  mediaUrl={config.featuredImage}
                  onMediaTypeChange={() => {}}
                  onMediaUrlChange={(url) => setConfig({ ...config, featuredImage: url })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Activities</CardTitle>
                <Button variant="outline" size="sm" onClick={addActivity}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {config.activities.map((activity, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={activity} onChange={e => updateActivity(index, e.target.value)} />
                    <Button variant="ghost" size="sm" onClick={() => removeActivity(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">What's Included</CardTitle>
                <Button variant="outline" size="sm" onClick={addIncludedItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {config.whatsIncluded.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={item} onChange={e => updateIncludedItem(index, e.target.value)} />
                    <Button variant="ghost" size="sm" onClick={() => removeIncludedItem(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Packages</h3>
              <Button variant="outline" size="sm" onClick={addPackage}>
                <Plus className="h-4 w-4 mr-1" /> Add Package
              </Button>
            </div>
            
            {config.packages.map((pkg, index) => (
              <Card key={pkg.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{pkg.name}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => removePackage(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Name</Label>
                      <Input value={pkg.name} onChange={e => updatePackage(index, 'name', e.target.value)} />
                    </div>
                    <div>
                      <Label>Price</Label>
                      <Input value={pkg.price} onChange={e => updatePackage(index, 'price', e.target.value)} />
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <Input value={pkg.frequency} onChange={e => updatePackage(index, 'frequency', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={pkg.description} onChange={e => updatePackage(index, 'description', e.target.value)} rows={2} />
                  </div>
                  <div>
                    <Label>Features (comma separated)</Label>
                    <Input
                      value={pkg.features.join(', ')}
                      onChange={e => updatePackage(index, 'features', e.target.value.split(', '))}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="form" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">Form Field Labels</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(config.formConfig.fields).map(([key, field]) => (
                  <div key={key} className="grid grid-cols-2 gap-3 p-3 border rounded">
                    <div>
                      <Label>{key} - Label</Label>
                      <Input
                        value={field.label}
                        onChange={e => setConfig({
                          ...config,
                          formConfig: {
                            ...config.formConfig,
                            fields: { ...config.formConfig.fields, [key]: { ...field, label: e.target.value } }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Placeholder</Label>
                      <Input
                        value={field.placeholder || ''}
                        onChange={e => setConfig({
                          ...config,
                          formConfig: {
                            ...config.formConfig,
                            fields: { ...config.formConfig.fields, [key]: { ...field, placeholder: e.target.value } }
                          }
                        })}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle className="text-lg">Buttons & Messages</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(config.formConfig.buttons).map(([key, value]) => (
                  <div key={key}>
                    <Label className="capitalize">{key} Button</Label>
                    <Input
                      value={value}
                      onChange={e => setConfig({
                        ...config,
                        formConfig: { ...config.formConfig, buttons: { ...config.formConfig.buttons, [key]: e.target.value } }
                      })}
                    />
                  </div>
                ))}
                {Object.entries(config.formConfig.messages).map(([key, value]) => (
                  <div key={key}>
                    <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                    <Textarea
                      value={value}
                      onChange={e => setConfig({
                        ...config,
                        formConfig: { ...config.formConfig, messages: { ...config.formConfig.messages, [key]: e.target.value } }
                      })}
                      rows={2}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 pt-4">
            <Card>
              <CardHeader><CardTitle className="text-lg">SEO Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input value={config.metaTitle} onChange={e => setConfig({ ...config, metaTitle: e.target.value })} maxLength={60} />
                  <p className="text-sm text-muted-foreground mt-1">{config.metaTitle.length}/60</p>
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <Textarea value={config.metaDescription} onChange={e => setConfig({ ...config, metaDescription: e.target.value })} maxLength={160} rows={3} />
                  <p className="text-sm text-muted-foreground mt-1">{config.metaDescription.length}/160</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
