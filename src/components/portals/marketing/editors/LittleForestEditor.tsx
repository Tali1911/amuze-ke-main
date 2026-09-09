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
import { defaultPageConfig, LittleForestPageConfig, ScheduleItem, SpecialFeature } from '@/hooks/useLittleForestConfig';
import { MultiDatePicker } from '@/components/forms/MultiDatePicker';
import MediaUploader from './MediaUploader';

interface LittleForestEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const LittleForestEditor: React.FC<LittleForestEditorProps> = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState<LittleForestPageConfig>(defaultPageConfig);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setIsFetching(true);
    try {
      // Try new format first
      const data = await cmsService.getContentBySlug('little-forest-page', 'experience_page');
      if (data?.metadata?.pageConfig) {
        setConfig({ ...defaultPageConfig, ...data.metadata.pageConfig });
      } else {
        // Try legacy format
        const legacyData = await cmsService.getContentBySlug('little-forest-form');
        if (legacyData?.metadata?.formConfig) {
          setConfig({ 
            ...defaultPageConfig, 
            formConfig: { ...defaultPageConfig.formConfig, ...legacyData.metadata.formConfig }
          });
        } else {
          setConfig(defaultPageConfig);
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setConfig(defaultPageConfig);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await cmsService.updateExperiencePageConfig('little-forest', { pageConfig: config });
      
      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('cms-content-updated'));
      
      toast.success('Little Forest page updated successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving Little Forest page:', error);
      toast.error('Failed to save page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvailableDatesChange = (dates: string[]) => {
    setConfig({
      ...config,
      formConfig: {
        ...config.formConfig,
        availableDates: dates
      }
    });
  };

  const handleMediaTypeChange = (type: 'photo' | 'video') => {
    setConfig({ ...config, mediaType: type });
  };

  const handleMediaUrlChange = (url: string) => {
    setConfig({ ...config, featuredImage: url });
  };

  // Schedule management
  const addScheduleItem = () => {
    setConfig({
      ...config,
      schedule: [...config.schedule, { time: '', activity: '', skills: '' }]
    });
  };

  const updateScheduleItem = (index: number, field: keyof ScheduleItem, value: string) => {
    setConfig({
      ...config,
      schedule: config.schedule.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    });
  };

  const removeScheduleItem = (index: number) => {
    setConfig({
      ...config,
      schedule: config.schedule.filter((_, i) => i !== index)
    });
  };

  // Special features management
  const addSpecialFeature = () => {
    setConfig({
      ...config,
      specialFeatures: [...config.specialFeatures, { title: '', description: '' }]
    });
  };

  const updateSpecialFeature = (index: number, field: keyof SpecialFeature, value: string) => {
    setConfig({
      ...config,
      specialFeatures: config.specialFeatures.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    });
  };

  const removeSpecialFeature = (index: number) => {
    setConfig({
      ...config,
      specialFeatures: config.specialFeatures.filter((_, i) => i !== index)
    });
  };

  if (isFetching) {
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
          <DialogTitle>Edit Little Forest Explorers Page</DialogTitle>
          <DialogDescription>Manage all content for the Little Forest registration page including featured image, schedule, and form settings</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="content">Page Content</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="dates">Session Dates</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="form">Form Config</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            {/* Page Content Tab */}
            <TabsContent value="content" className="space-y-4 pt-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Page Header</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Page Title</Label>
                    <Input 
                      value={config.title} 
                      onChange={e => setConfig({ ...config, title: e.target.value })} 
                      placeholder="Little Forest Explorers"
                    />
                  </div>
                  <div>
                    <Label>Subtitle</Label>
                    <Input 
                      value={config.subtitle} 
                      onChange={e => setConfig({ ...config, subtitle: e.target.value })} 
                      placeholder="(Ages 3 & Below)"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea 
                      value={config.description} 
                      onChange={e => setConfig({ ...config, description: e.target.value })} 
                      rows={4}
                      placeholder="Program description..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Featured Image/Video</CardTitle></CardHeader>
                <CardContent>
                  <MediaUploader
                    mediaType={config.mediaType}
                    mediaUrl={config.featuredImage}
                    onMediaTypeChange={handleMediaTypeChange}
                    onMediaUrlChange={handleMediaUrlChange}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Special Focus Areas</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addSpecialFeature}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {config.specialFeatures.map((feature, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Title</Label>
                          <Input 
                            value={feature.title} 
                            onChange={e => updateSpecialFeature(index, 'title', e.target.value)}
                            placeholder="Feature title"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Input 
                            value={feature.description} 
                            onChange={e => updateSpecialFeature(index, 'description', e.target.value)}
                            placeholder="Feature description"
                          />
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSpecialFeature(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4 pt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Daily Schedule</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addScheduleItem}>
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {config.schedule.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start p-3 border rounded">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Time</Label>
                          <Input 
                            value={item.time} 
                            onChange={e => updateScheduleItem(index, 'time', e.target.value)}
                            placeholder="10:00"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Activity</Label>
                          <Input 
                            value={item.activity} 
                            onChange={e => updateScheduleItem(index, 'activity', e.target.value)}
                            placeholder="Activity name"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Skills</Label>
                          <Input 
                            value={item.skills} 
                            onChange={e => updateScheduleItem(index, 'skills', e.target.value)}
                            placeholder="Skills developed"
                          />
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeScheduleItem(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Session Dates Tab */}
            <TabsContent value="dates" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Available Session Dates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select the specific dates when Little Forest sessions are available. 
                    Parents will be able to choose from these dates on the registration form.
                  </p>
                  <MultiDatePicker
                    selectedDates={config.formConfig.availableDates || []}
                    onChange={handleAvailableDatesChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4 pt-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Pricing Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sessionRate">Session Rate (per date)</Label>
                      <Input
                        id="sessionRate"
                        type="number"
                        value={config.formConfig.pricing.sessionRate}
                        onChange={(e) => setConfig({
                          ...config,
                          formConfig: { 
                            ...config.formConfig, 
                            pricing: { ...config.formConfig.pricing, sessionRate: Number(e.target.value) } 
                          }
                        })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Price per session date selected</p>
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        value={config.formConfig.pricing.currency}
                        onChange={(e) => setConfig({
                          ...config,
                          formConfig: { 
                            ...config.formConfig, 
                            pricing: { ...config.formConfig.pricing, currency: e.target.value } 
                          }
                        })}
                      />
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded p-4">
                    <p className="text-sm font-medium mb-2">Pricing Summary</p>
                    <p className="text-sm text-muted-foreground">
                      Each session date costs: {config.formConfig.pricing.currency} {config.formConfig.pricing.sessionRate.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Form Config Tab */}
            <TabsContent value="form" className="space-y-4 pt-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Form Field Labels</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(config.formConfig.fields).map(([key, field]) => (
                    <div key={key} className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`${key}-label`}>Label</Label>
                          <Input
                            id={`${key}-label`}
                            value={field.label}
                            onChange={(e) => setConfig({
                              ...config,
                              formConfig: {
                                ...config.formConfig,
                                fields: {
                                  ...config.formConfig.fields,
                                  [key]: { ...field, label: e.target.value }
                                }
                              }
                            })}
                          />
                        </div>
                        {'placeholder' in field && (
                          <div>
                            <Label htmlFor={`${key}-placeholder`}>Placeholder</Label>
                            <Input
                              id={`${key}-placeholder`}
                              value={field.placeholder}
                              onChange={(e) => setConfig({
                                ...config,
                                formConfig: {
                                  ...config.formConfig,
                                  fields: {
                                    ...config.formConfig.fields,
                                    [key]: { ...field, placeholder: e.target.value }
                                  }
                                }
                              })}
                            />
                          </div>
                        )}
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
                      <Label htmlFor={`btn-${key}`} className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <Input
                        id={`btn-${key}`}
                        value={value}
                        onChange={(e) => setConfig({
                          ...config,
                          formConfig: { 
                            ...config.formConfig, 
                            buttons: { ...config.formConfig.buttons, [key]: e.target.value } 
                          }
                        })}
                      />
                    </div>
                  ))}
                  {Object.entries(config.formConfig.messages).map(([key, value]) => (
                    <div key={key}>
                      <Label htmlFor={`msg-${key}`} className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <Textarea
                        id={`msg-${key}`}
                        value={value}
                        onChange={(e) => setConfig({
                          ...config,
                          formConfig: { 
                            ...config.formConfig, 
                            messages: { ...config.formConfig.messages, [key]: e.target.value } 
                          }
                        })}
                        rows={2}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO Tab */}
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
