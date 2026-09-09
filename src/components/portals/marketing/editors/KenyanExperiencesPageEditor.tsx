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
import MediaUploader from './MediaUploader';

interface KenyanExperience {
  id: string;
  title: string;
  description: string;
  duration: string;
  ageGroup: string;
  highlights: string[];
}

interface KenyanExperiencesConfig {
  title: string;
  subtitle: string;
  description: string;
  featuredMediaUrl: string;
  mediaType: 'photo' | 'video';
  videoThumbnail?: string;
  experiences: KenyanExperience[];
  formConfig: {
    fields: Record<string, { label: string; placeholder?: string; helpText?: string }>;
    buttons: Record<string, string>;
    messages: Record<string, string>;
  };
  metaTitle: string;
  metaDescription: string;
}

interface KenyanExperiencesPageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
}

const defaultExperiences: KenyanExperience[] = [
  {
    id: 'safari-adventure',
    title: 'Safari Adventure',
    description: 'Experience Kenya\'s incredible wildlife in their natural habitat.',
    duration: '3-5 days',
    ageGroup: '8+ years',
    highlights: ['Game drives', 'Wildlife photography', 'Night safaris', 'Conservation education']
  },
  {
    id: 'cultural-immersion',
    title: 'Cultural Immersion',
    description: 'Connect with local communities and learn about Kenyan traditions.',
    duration: '2-3 days',
    ageGroup: 'All ages',
    highlights: ['Village visits', 'Traditional crafts', 'Local cuisine', 'Storytelling']
  }
];

const defaultConfig: KenyanExperiencesConfig = {
  title: 'Kenyan Experiences',
  subtitle: 'Discover the Magic of Kenya',
  description: 'Multi-day adventures showcasing Kenya\'s wildlife, culture, and natural wonders.',
  featuredMediaUrl: '',
  mediaType: 'photo',
  experiences: defaultExperiences,
  formConfig: {
    fields: {
      leaderName: { label: 'Group Leader Name', placeholder: 'Name of organizer' },
      groupSize: { label: 'Group Size', placeholder: 'Number of participants' },
      experience: { label: 'Experience Type', placeholder: 'Select an experience' },
      preferredDates: { label: 'Preferred Dates', placeholder: 'When would you like to travel?' },
      email: { label: 'Email Address', placeholder: 'Your email' },
      phone: { label: 'Phone Number', placeholder: 'Contact number' }
    },
    buttons: { submit: 'Request Quote', back: 'Back to Programs' },
    messages: {
      successMessage: 'Thank you! We\'ll send you a customized quote within 48 hours.',
      errorMessage: 'Failed to submit. Please try again.',
      loadingMessage: 'Sending request...'
    }
  },
  metaTitle: 'Kenyan Experiences | Multi-Day Adventures | Amuse Kenya',
  metaDescription: 'Multi-day safaris, cultural immersions, and nature explorations across Kenya.'
};

export const KenyanExperiencesPageEditor: React.FC<KenyanExperiencesPageEditorProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [config, setConfig] = useState<KenyanExperiencesConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) loadConfig();
  }, [isOpen]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const content = await cmsService.getContentBySlug('kenyan-experiences-page', 'experience_page');
      if (content?.metadata?.pageConfig) {
        setConfig({ ...defaultConfig, ...content.metadata.pageConfig });
      } else {
        // Try loading from older format
        const oldContent = await cmsService.getExperiencePageConfig('kenyan-experiences');
        if (oldContent?.metadata) {
          setConfig({
            ...defaultConfig,
            featuredMediaUrl: oldContent.metadata.mediaUrl || '',
            mediaType: oldContent.metadata.mediaType || 'photo',
            videoThumbnail: oldContent.metadata.videoThumbnail
          });
        }
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
      await cmsService.updateExperiencePageConfig('kenyan-experiences', {
        pageConfig: config,
        mediaUrl: config.featuredMediaUrl,
        mediaType: config.mediaType,
        videoThumbnail: config.videoThumbnail
      });
      toast.success('Kenyan Experiences page saved successfully');
      await onSave();
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const updateExperience = (index: number, field: keyof KenyanExperience, value: any) => {
    setConfig(prev => ({
      ...prev,
      experiences: prev.experiences.map((e, i) => i === index ? { ...e, [field]: value } : e)
    }));
  };

  const addExperience = () => {
    setConfig(prev => ({
      ...prev,
      experiences: [...prev.experiences, {
        id: `exp-${Date.now()}`,
        title: 'New Experience',
        description: 'Experience description',
        duration: '2-3 days',
        ageGroup: 'All ages',
        highlights: ['Highlight 1']
      }]
    }));
  };

  const removeExperience = (index: number) => {
    setConfig(prev => ({ ...prev, experiences: prev.experiences.filter((_, i) => i !== index) }));
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
          <DialogTitle>Edit Kenyan Experiences Page</DialogTitle>
          <DialogDescription>Manage content for the Kenyan Experiences registration page</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Page Content</TabsTrigger>
            <TabsTrigger value="experiences">Experiences</TabsTrigger>
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
                  mediaType={config.mediaType}
                  mediaUrl={config.featuredMediaUrl}
                  thumbnailUrl={config.videoThumbnail}
                  onMediaTypeChange={(type) => setConfig({ ...config, mediaType: type })}
                  onMediaUrlChange={(url) => setConfig({ ...config, featuredMediaUrl: url })}
                  onThumbnailUrlChange={(url) => setConfig({ ...config, videoThumbnail: url })}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experiences" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Experience Cards</h3>
              <Button variant="outline" size="sm" onClick={addExperience}>
                <Plus className="h-4 w-4 mr-1" /> Add Experience
              </Button>
            </div>
            
            {config.experiences.map((exp, index) => (
              <Card key={exp.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{exp.title}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => removeExperience(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Title</Label>
                      <Input value={exp.title} onChange={e => updateExperience(index, 'title', e.target.value)} />
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <Input value={exp.duration} onChange={e => updateExperience(index, 'duration', e.target.value)} />
                    </div>
                    <div>
                      <Label>Age Group</Label>
                      <Input value={exp.ageGroup} onChange={e => updateExperience(index, 'ageGroup', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={exp.description} onChange={e => updateExperience(index, 'description', e.target.value)} rows={2} />
                  </div>
                  <div>
                    <Label>Highlights (comma separated)</Label>
                    <Input
                      value={exp.highlights.join(', ')}
                      onChange={e => updateExperience(index, 'highlights', e.target.value.split(', '))}
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
