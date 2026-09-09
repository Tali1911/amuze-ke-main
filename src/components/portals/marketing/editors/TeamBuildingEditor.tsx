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
import MediaUploader from './MediaUploader';
import { TeamBuildingPageConfig, TeamBuildingPackage, SampleFlowItem } from '@/hooks/useTeamBuildingPageConfig';

interface TeamBuildingEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const defaultConfig: TeamBuildingPageConfig = {
  title: 'Team Building',
  subtitle: '(All Ages)',
  description: 'Create safe, fun, memory-filled experiences with measurable outcomes. Each package is 90% fun + 10% reflection, focusing on team communication and problem-solving.',
  featuredMediaUrl: '',
  mediaType: 'photo',
  packages: [
    {
      id: 'adventure',
      title: 'Adventure Party',
      description: 'Arrival Icebreaker • Obstacle Challenge • Water Game • Treasure Hunt • Cake & Awards • Closing Circle',
      features: ['Team Communication', 'Problem-Solving', '90% Fun + 10% Reflection']
    },
    {
      id: 'bushcraft',
      title: 'Bushcraft Bash',
      description: 'Fire-making challenges, shelter building, navigation skills, and outdoor cooking activities.',
      features: ['Survival Skills', 'Leadership', 'Outdoor Confidence']
    },
    {
      id: 'nature-carnival',
      title: 'Nature Carnival',
      description: 'Nature games, eco-friendly activities, wildlife exploration, and environmental challenges.',
      features: ['Environmental Awareness', 'Teamwork', 'Creative Problem-Solving']
    },
    {
      id: 'family-corporate',
      title: 'Family/Corporate Build',
      description: 'Customized team building experiences for families and corporate groups with measurable outcomes.',
      features: ['Custom Activities', 'Team Bonding', 'Measurable Results']
    }
  ],
  sampleFlow: [
    { title: 'Arrival Icebreaker', description: 'Welcome activities and team formation' },
    { title: 'Obstacle Challenge', description: 'Physical and mental challenges' },
    { title: 'Water Game', description: 'Fun water-based team activities' },
    { title: 'Treasure Hunt', description: 'Problem-solving adventure' },
    { title: 'Cake & Awards', description: 'Celebration and recognition' },
    { title: 'Closing Circle', description: 'Reflection and key takeaways' }
  ],
  formConfig: {
    formTitle: 'Book Your Experience',
    ctaText: 'Book Experience',
    fields: {
      occasion: { label: 'Occasion', placeholder: 'Select occasion' },
      adultsNumber: { label: 'Number of Adults', placeholder: 'e.g., 10' },
      childrenNumber: { label: 'Number of Children', placeholder: 'e.g., 5' },
      ageRange: { label: 'Age Range', placeholder: 'Select age range' },
      package: { label: 'Package', placeholder: 'Select a package' },
      eventDate: { label: 'Event Date', placeholder: 'Select date' },
      location: { label: 'Location', placeholder: 'Select location' },
      decor: { label: 'Decoration Package' },
      catering: { label: 'Catering Services' },
      email: { label: 'Email Address', placeholder: 'your@email.com' },
      phone: { label: 'Phone Number', placeholder: '+254 700 000 000' }
    },
    buttons: {
      submit: 'Book Experience',
      back: 'Back to Home'
    },
    messages: {
      successMessage: 'Booking submitted successfully! We\'ll contact you shortly.',
      errorMessage: 'Failed to submit booking. Please try again.',
      loadingMessage: 'Submitting...'
    }
  },
  metaTitle: 'Team Building Programs | Amuse Kenya Corporate Events',
  metaDescription: 'Strengthen your team with nature-based team building activities at Karura Forest. Customized corporate programs focusing on collaboration, communication, and leadership development.',
  keywords: 'team building Kenya, corporate events, team activities, leadership training, corporate retreats Nairobi'
};

export const TeamBuildingEditor: React.FC<TeamBuildingEditorProps> = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState<TeamBuildingPageConfig>(defaultConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const content = await cmsService.getContentBySlug('team-building-page', 'experience_page');
      if (content) {
        setExistingId(content.id);
        if (content.metadata?.pageConfig) {
          setConfig({ ...defaultConfig, ...content.metadata.pageConfig });
        }
      }
    } catch (error) {
      console.error('Error loading team building config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await cmsService.updateExperiencePageConfig('team-building', { pageConfig: config });
      window.dispatchEvent(new CustomEvent('cms-content-updated'));
      toast.success('Team Building page saved successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving team building config:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePackage = (index: number, field: keyof TeamBuildingPackage, value: any) => {
    const updated = [...config.packages];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, packages: updated });
  };

  const updatePackageFeature = (pkgIndex: number, featIndex: number, value: string) => {
    const updated = [...config.packages];
    const features = [...updated[pkgIndex].features];
    features[featIndex] = value;
    updated[pkgIndex] = { ...updated[pkgIndex], features };
    setConfig({ ...config, packages: updated });
  };

  const addPackageFeature = (pkgIndex: number) => {
    const updated = [...config.packages];
    updated[pkgIndex] = { ...updated[pkgIndex], features: [...updated[pkgIndex].features, ''] };
    setConfig({ ...config, packages: updated });
  };

  const removePackageFeature = (pkgIndex: number, featIndex: number) => {
    const updated = [...config.packages];
    const features = updated[pkgIndex].features.filter((_, i) => i !== featIndex);
    updated[pkgIndex] = { ...updated[pkgIndex], features };
    setConfig({ ...config, packages: updated });
  };

  const addPackage = () => {
    const newPackage: TeamBuildingPackage = {
      id: `package-${Date.now()}`,
      title: 'New Package',
      description: 'Package description',
      features: ['Feature 1']
    };
    setConfig({ ...config, packages: [...config.packages, newPackage] });
  };

  const removePackage = (index: number) => {
    const updated = config.packages.filter((_, i) => i !== index);
    setConfig({ ...config, packages: updated });
  };

  const updateSampleFlowItem = (index: number, field: keyof SampleFlowItem, value: string) => {
    const updated = [...config.sampleFlow];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, sampleFlow: updated });
  };

  const addSampleFlowItem = () => {
    setConfig({ 
      ...config, 
      sampleFlow: [...config.sampleFlow, { title: '', description: '' }] 
    });
  };

  const removeSampleFlowItem = (index: number) => {
    const updated = config.sampleFlow.filter((_, i) => i !== index);
    setConfig({ ...config, sampleFlow: updated });
  };

  const updateFormField = (fieldKey: string, property: string, value: string) => {
    setConfig({
      ...config,
      formConfig: {
        ...config.formConfig,
        fields: {
          ...config.formConfig.fields,
          [fieldKey]: {
            ...config.formConfig.fields[fieldKey],
            [property]: value
          }
        }
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Team Building Page</DialogTitle>
          <DialogDescription>Update page content, packages, form labels, and SEO settings</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">Loading...</div>
        ) : (
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="flow">Sample Flow</TabsTrigger>
              <TabsTrigger value="form">Form Config</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Page Title</Label>
                  <Input
                    value={config.title}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={config.subtitle}
                    onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Featured Media</Label>
                <MediaUploader
                  mediaUrl={config.featuredMediaUrl}
                  mediaType={config.mediaType}
                  onMediaTypeChange={(type) => setConfig({ ...config, mediaType: type })}
                  onMediaUrlChange={(url) => setConfig({ ...config, featuredMediaUrl: url })}
                  storagePath="team-building"
                />
              </div>
            </TabsContent>

            <TabsContent value="packages" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Available Packages</h3>
                <Button onClick={addPackage} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Package
                </Button>
              </div>

              <div className="space-y-4">
                {config.packages.map((pkg, pkgIndex) => (
                  <Card key={pkg.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={pkg.title}
                            onChange={(e) => updatePackage(pkgIndex, 'title', e.target.value)}
                            className="font-semibold w-48"
                          />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removePackage(pkgIndex)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={pkg.description}
                          onChange={(e) => updatePackage(pkgIndex, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label>Features</Label>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addPackageFeature(pkgIndex)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {pkg.features.map((feature, featIndex) => (
                            <div key={featIndex} className="flex gap-2">
                              <Input
                                value={feature}
                                onChange={(e) => updatePackageFeature(pkgIndex, featIndex, e.target.value)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePackageFeature(pkgIndex, featIndex)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="flow" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Sample Adventure Party Flow</h3>
                <Button onClick={addSampleFlowItem} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Step
                </Button>
              </div>

              <div className="space-y-3">
                {config.sampleFlow.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start border rounded-lg p-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Step Title</Label>
                        <Input
                          value={item.title}
                          onChange={(e) => updateSampleFlowItem(index, 'title', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateSampleFlowItem(index, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSampleFlowItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="form" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Form Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Form Title</Label>
                      <Input
                        value={config.formConfig.formTitle}
                        onChange={(e) => setConfig({
                          ...config,
                          formConfig: { ...config.formConfig, formTitle: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Submit Button Text</Label>
                      <Input
                        value={config.formConfig.ctaText}
                        onChange={(e) => setConfig({
                          ...config,
                          formConfig: { ...config.formConfig, ctaText: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Field Labels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(config.formConfig.fields).map(([key, field]) => (
                    <div key={key} className="grid grid-cols-2 gap-3 pb-3 border-b last:border-b-0">
                      <div className="space-y-1">
                        <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()} Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateFormField(key, 'label', e.target.value)}
                        />
                      </div>
                      {field.placeholder !== undefined && (
                        <div className="space-y-1">
                          <Label className="text-xs">Placeholder</Label>
                          <Input
                            value={field.placeholder || ''}
                            onChange={(e) => updateFormField(key, 'placeholder', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Messages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Success Message</Label>
                    <Textarea
                      value={config.formConfig.messages.successMessage}
                      onChange={(e) => setConfig({
                        ...config,
                        formConfig: {
                          ...config.formConfig,
                          messages: { ...config.formConfig.messages, successMessage: e.target.value }
                        }
                      })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Error Message</Label>
                    <Input
                      value={config.formConfig.messages.errorMessage}
                      onChange={(e) => setConfig({
                        ...config,
                        formConfig: {
                          ...config.formConfig,
                          messages: { ...config.formConfig.messages, errorMessage: e.target.value }
                        }
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={config.metaTitle}
                  onChange={(e) => setConfig({ ...config, metaTitle: e.target.value })}
                  maxLength={60}
                />
                <p className="text-sm text-muted-foreground">{config.metaTitle.length}/60</p>
              </div>

              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={config.metaDescription}
                  onChange={(e) => setConfig({ ...config, metaDescription: e.target.value })}
                  rows={3}
                  maxLength={160}
                />
                <p className="text-sm text-muted-foreground">{config.metaDescription.length}/160</p>
              </div>

              <div className="space-y-2">
                <Label>Keywords (comma-separated)</Label>
                <Input
                  value={config.keywords}
                  onChange={(e) => setConfig({ ...config, keywords: e.target.value })}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
