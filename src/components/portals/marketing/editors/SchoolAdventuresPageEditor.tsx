import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { cmsService } from '@/services/cmsService';
import { supabase } from '@/integrations/supabase/client';
import MediaUploader from './MediaUploader';

interface SchoolAdventuresProgram {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  description: string;
  features: string[];
  examples: string[];
}

interface SchoolAdventuresConfig {
  title: string;
  subtitle: string;
  description: string;
  featuredImage: string;
  programs: SchoolAdventuresProgram[];
  formConfig: {
    fields: Record<string, { label: string; placeholder?: string; helpText?: string }>;
    buttons: Record<string, string>;
    messages: Record<string, string>;
  };
  metaTitle: string;
  metaDescription: string;
}

interface SchoolAdventuresPageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
}

const defaultPrograms: SchoolAdventuresProgram[] = [
  {
    id: 'forest-days',
    title: 'Forest Days',
    tagline: 'Nature-based learning',
    icon: 'Trees',
    description: 'Regular forest school sessions that bring classroom lessons to life in a natural setting.',
    features: ['Nature walks', 'Outdoor classrooms', 'Wildlife observation', 'Plant identification'],
    examples: ['Weekly nature club', 'Science field studies', 'Art in nature']
  },
  {
    id: 'field-trips',
    title: 'Field Trips',
    tagline: 'Educational adventures',
    icon: 'MapPin',
    description: 'Day excursions to various natural and cultural sites across Kenya.',
    features: ['Guided tours', 'Educational activities', 'Transport included', 'Curriculum aligned'],
    examples: ['National parks', 'Museums', 'Cultural centers']
  },
  {
    id: 'industrial-visits',
    title: 'Industrial Visits',
    tagline: 'Real-world learning',
    icon: 'Building2',
    description: 'Visits to farms, factories, and businesses to understand how things work.',
    features: ['Factory tours', 'Farm visits', 'Career exposure', 'Interactive learning'],
    examples: ['Dairy farms', 'Manufacturing plants', 'Tech companies']
  },
  {
    id: 'sleep-away-camps',
    title: 'Sleep-Away Camps',
    tagline: 'Overnight adventures',
    icon: 'Tent',
    description: 'Multi-day camping experiences with outdoor skills, team building, and adventure.',
    features: ['Overnight camping', 'Adventure activities', 'Team challenges', 'Campfire programs'],
    examples: ['2-3 day camps', 'End of term camps', 'Leadership retreats']
  }
];

const defaultConfig: SchoolAdventuresConfig = {
  title: 'School Adventures',
  subtitle: '(Ages 6-17 years)',
  description: 'Transform your school\'s outdoor learning with our comprehensive adventure programs.',
  featuredImage: '',
  programs: defaultPrograms,
  formConfig: {
    fields: {
      schoolName: { label: 'School Name', placeholder: 'Enter your school name' },
      numberOfStudents: { label: 'Number of Students', placeholder: 'Estimated number' },
      programType: { label: 'Program Type', placeholder: 'Select a program' },
      preferredDates: { label: 'Preferred Dates', placeholder: 'Select dates' },
      contactPerson: { label: 'Contact Person', placeholder: 'Name of coordinator' },
      email: { label: 'Email Address', placeholder: 'School or coordinator email' },
      phone: { label: 'Phone Number', placeholder: 'Contact number' }
    },
    buttons: { submit: 'Submit Enquiry', back: 'Back to Home' },
    messages: {
      successMessage: 'Thank you for your enquiry! We\'ll contact you within 24 hours.',
      errorMessage: 'Failed to submit. Please try again.',
      loadingMessage: 'Submitting...'
    }
  },
  metaTitle: 'School Adventures | Amuse Kenya Outdoor Education',
  metaDescription: 'Curriculum-aligned outdoor education programs for schools.'
};

export const SchoolAdventuresPageEditor: React.FC<SchoolAdventuresPageEditorProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [config, setConfig] = useState<SchoolAdventuresConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const content = await cmsService.getContentBySlug('school-adventures-page', 'experience_page');
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
      const { data: { user } } = await supabase.auth.getUser();
      
      await cmsService.updateExperiencePageConfig('school-adventures', {
        pageConfig: config
      });
      
      toast.success('School Adventures page saved successfully');
      await onSave();
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const updateProgram = (index: number, field: keyof SchoolAdventuresProgram, value: any) => {
    setConfig(prev => ({
      ...prev,
      programs: prev.programs.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const addProgram = () => {
    setConfig(prev => ({
      ...prev,
      programs: [...prev.programs, {
        id: `program-${Date.now()}`,
        title: 'New Program',
        tagline: 'Program tagline',
        icon: 'Star',
        description: 'Program description',
        features: ['Feature 1'],
        examples: ['Example 1']
      }]
    }));
  };

  const removeProgram = (index: number) => {
    setConfig(prev => ({
      ...prev,
      programs: prev.programs.filter((_, i) => i !== index)
    }));
  };

  const updateProgramFeature = (programIndex: number, featureIndex: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      programs: prev.programs.map((p, i) => {
        if (i !== programIndex) return p;
        return {
          ...p,
          features: p.features.map((f, fi) => fi === featureIndex ? value : f)
        };
      })
    }));
  };

  const addProgramFeature = (programIndex: number) => {
    setConfig(prev => ({
      ...prev,
      programs: prev.programs.map((p, i) => {
        if (i !== programIndex) return p;
        return { ...p, features: [...p.features, ''] };
      })
    }));
  };

  const removeProgramFeature = (programIndex: number, featureIndex: number) => {
    setConfig(prev => ({
      ...prev,
      programs: prev.programs.map((p, i) => {
        if (i !== programIndex) return p;
        return { ...p, features: p.features.filter((_, fi) => fi !== featureIndex) };
      })
    }));
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
          <DialogTitle>Edit School Adventures Page</DialogTitle>
          <DialogDescription>Manage all content for the School Adventures registration page</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">Page Content</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
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
          </TabsContent>

          <TabsContent value="programs" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Program Cards</h3>
              <Button variant="outline" size="sm" onClick={addProgram}>
                <Plus className="h-4 w-4 mr-1" /> Add Program
              </Button>
            </div>
            
            {config.programs.map((program, index) => (
              <Card key={program.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{program.title}</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeProgram(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Title</Label>
                      <Input value={program.title} onChange={e => updateProgram(index, 'title', e.target.value)} />
                    </div>
                    <div>
                      <Label>Tagline</Label>
                      <Input value={program.tagline} onChange={e => updateProgram(index, 'tagline', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={program.description} onChange={e => updateProgram(index, 'description', e.target.value)} rows={2} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Features</Label>
                      <Button variant="ghost" size="sm" onClick={() => addProgramFeature(index)}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {program.features.map((feature, fi) => (
                      <div key={fi} className="flex gap-2 mb-2">
                        <Input value={feature} onChange={e => updateProgramFeature(index, fi, e.target.value)} />
                        <Button variant="ghost" size="sm" onClick={() => removeProgramFeature(index, fi)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
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
                  <Input
                    value={config.metaTitle}
                    onChange={e => setConfig({ ...config, metaTitle: e.target.value })}
                    maxLength={60}
                  />
                  <p className="text-sm text-muted-foreground mt-1">{config.metaTitle.length}/60</p>
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <Textarea
                    value={config.metaDescription}
                    onChange={e => setConfig({ ...config, metaDescription: e.target.value })}
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-1">{config.metaDescription.length}/160</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
