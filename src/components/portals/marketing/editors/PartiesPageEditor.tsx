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
import { PartiesPageConfig, PartyOption, AddOn } from '@/hooks/usePartiesPageConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PartiesPageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
}

const defaultConfig: PartiesPageConfig = {
  title: 'Parties & Celebrations',
  subtitle: 'Customised parties and team-building events with a focus on fun and tangible outcomes.',
  description: 'Make your special occasion extraordinary! Our outdoor party packages combine nature, adventure, and celebration for birthday parties, family gatherings, and group events.',
  featuredMediaUrl: '',
  mediaType: 'photo',
  partyOptions: [
    {
      id: 'karura-forest',
      title: 'Come to Karura Forest',
      icon: 'TreePine',
      shortDescription: 'Bring your child to Karura, where most of our outdoor adventures happens!',
      fullDescription: 'Bring your child to Karura, where most of our outdoor adventures happens! Here, your child and their friends will enjoy adventure activities, bushcraft, creative outdoor play, and more—all in a safe, supervised environment with trained facilitators.',
      features: [
        'Adventure activities like obstacle courses, rope course, nature scavenger hunts',
        'Bushcraft and creative outdoor play',
        'Safe, supervised fun with trained facilitators',
        'Custom themes and setups to make the day extra special'
      ],
      idealFor: 'Perfect for children of all ages who love nature, movement, and exploration.',
      note: 'In line with forest guidelines, no single-use plastics are allowed.'
    },
    {
      id: 'we-come-to-you',
      title: 'We Come to You',
      icon: 'Home',
      shortDescription: 'No need to travel—we can bring the adventure to your chosen location!',
      fullDescription: 'No need to travel—we can bring the adventure to your chosen location! Our team sets up fun, engaging, and safe outdoor activities wherever you are.',
      features: [
        'Our team sets up fun, engaging, and safe outdoor activities wherever you are',
        'Ideal for home gardens, schools, or community spaces',
        'Activities can be customized for your child\'s age, interests, and group size',
        'Full facilitation and equipment provided'
      ],
      idealFor: 'Perfect for families looking for outdoor birthday parties without leaving home.'
    },
    {
      id: 'overnight-camping',
      title: 'Overnight Camping (Preteens & Teens)',
      icon: 'Moon',
      shortDescription: 'Take your child\'s birthday to the next level with an immersive overnight adventure.',
      fullDescription: 'Take your child\'s birthday to the next level with an immersive overnight adventure.',
      features: [
        'Sleep in spacious tents and enjoy hands-on adventure activities',
        'Bond with friends through night activities, campfire stories, and outdoor movie nights',
        'Build life skills including independence, teamwork, resilience'
      ],
      idealFor: 'Perfect for preteens and teenagers seeking a memorable celebration.'
    }
  ],
  details: {
    partyTypes: 'Birthdays, anniversaries, reunions',
    groupSize: '10-50 guests',
    duration: 'Half-day / Full-day / Overnight',
    location: 'Our center or your choice'
  },
  whatsIncluded: [
    'Customized party themes',
    'Outdoor adventure activities',
    'Party games and entertainment',
    'Dedicated party area',
    'Basic decorations and setup',
    'Professional event coordination',
    'Photography opportunities',
    'Age-appropriate activities',
    'Safety equipment and supervision',
    'Flexible catering options'
  ],
  addOns: [
    { icon: 'Cake', text: 'Custom cake and catering services' },
    { icon: 'Camera', text: 'Professional photography package' },
    { icon: 'Star', text: 'Special activity sessions (rock climbing, kayaking)' },
    { icon: 'Gift', text: 'Party favors and gift bags' }
  ],
  formConfig: {
    formTitle: 'Book Your Party',
    ctaText: 'Book Party',
    fields: {
      occasion: { label: 'Occasion', placeholder: 'Select occasion' },
      parentName: { label: 'Organizer Name', placeholder: 'Enter your full name' },
      childName: { label: 'Child Name', placeholder: 'Enter child\'s full name' },
      dateOfBirth: { label: 'Date of Birth', placeholder: 'Select date' },
      specialNeeds: { label: 'Special/Medical Needs', placeholder: 'Allergies, medical conditions, etc.' },
      guestsNumber: { label: 'Number of Guests', placeholder: 'Total number of guests (10-50)' },
      packageType: { label: 'Package Type', placeholder: 'Select package' },
      eventTiming: { label: 'Event Timing', placeholder: 'Select timing' },
      eventDate: { label: 'Event Date', placeholder: 'Select date' },
      startTime: { label: 'Start Time', placeholder: 'e.g., 09:00' },
      endTime: { label: 'End Time', placeholder: 'e.g., 14:00' },
      location: { label: 'Location', placeholder: 'Select location' },
      decor: { label: 'Enhanced Decoration Package' },
      catering: { label: 'Catering Services' },
      photography: { label: 'Professional Photography' },
      activities: { label: 'Special Activities' },
      email: { label: 'Email Address', placeholder: 'your@email.com' },
      phone: { label: 'Phone Number', placeholder: '+254 700 000 000' }
    },
    buttons: {
      submit: 'Book Party',
      addChild: 'Add Child',
      removeChild: 'Remove',
      back: 'Back to Home'
    },
    messages: {
      successMessage: 'Party booking submitted successfully! We\'ll contact you shortly.',
      errorMessage: 'Failed to submit booking. Please try again.',
      loadingMessage: 'Submitting...'
    }
  },
  metaTitle: 'Parties & Celebrations | Amuse Kenya Forest Adventures',
  metaDescription: 'Host unforgettable birthday parties and celebrations at Karura Forest, at your venue, or as an overnight camping experience.'
};

export const PartiesPageEditor: React.FC<PartiesPageEditorProps> = ({ 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [config, setConfig] = useState<PartiesPageConfig>(defaultConfig);
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
      const content = await cmsService.getContentBySlug('parties-page', 'experience_page');
      if (content) {
        setExistingId(content.id);
        if (content.metadata?.pageConfig) {
          setConfig({ ...defaultConfig, ...content.metadata.pageConfig });
        }
      }
    } catch (error) {
      console.error('Error loading parties config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await cmsService.updateExperiencePageConfig('parties', { pageConfig: config });
      window.dispatchEvent(new CustomEvent('cms-content-updated'));
      toast.success('Parties page saved successfully');
      await onSave();
      onClose();
    } catch (error) {
      console.error('Error saving parties config:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
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

  const addIncludedItem = () => {
    setConfig(prev => ({
      ...prev,
      whatsIncluded: [...prev.whatsIncluded, '']
    }));
  };

  const updateIncludedItem = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      whatsIncluded: prev.whatsIncluded.map((item, i) => i === index ? value : item)
    }));
  };

  const removeIncludedItem = (index: number) => {
    setConfig(prev => ({
      ...prev,
      whatsIncluded: prev.whatsIncluded.filter((_, i) => i !== index)
    }));
  };

  const addAddOn = () => {
    setConfig(prev => ({
      ...prev,
      addOns: [...prev.addOns, { icon: 'Star', text: '' }]
    }));
  };

  const updateAddOn = (index: number, field: 'icon' | 'text', value: string) => {
    setConfig(prev => ({
      ...prev,
      addOns: prev.addOns.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeAddOn = (index: number) => {
    setConfig(prev => ({
      ...prev,
      addOns: prev.addOns.filter((_, i) => i !== index)
    }));
  };

  const updatePartyOption = (index: number, field: keyof PartyOption, value: any) => {
    setConfig(prev => ({
      ...prev,
      partyOptions: prev.partyOptions.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const updatePartyOptionFeature = (optIndex: number, featIndex: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      partyOptions: prev.partyOptions.map((opt, i) => {
        if (i !== optIndex) return opt;
        const features = [...opt.features];
        features[featIndex] = value;
        return { ...opt, features };
      })
    }));
  };

  const addPartyOptionFeature = (optIndex: number) => {
    setConfig(prev => ({
      ...prev,
      partyOptions: prev.partyOptions.map((opt, i) => 
        i === optIndex ? { ...opt, features: [...opt.features, ''] } : opt
      )
    }));
  };

  const removePartyOptionFeature = (optIndex: number, featIndex: number) => {
    setConfig(prev => ({
      ...prev,
      partyOptions: prev.partyOptions.map((opt, i) => {
        if (i !== optIndex) return opt;
        return { ...opt, features: opt.features.filter((_, fi) => fi !== featIndex) };
      })
    }));
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Parties & Celebrations Page</DialogTitle>
          <DialogDescription>Update page content, party options, form labels, and SEO settings</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="options">Party Options</TabsTrigger>
            <TabsTrigger value="extras">Includes & Add-Ons</TabsTrigger>
            <TabsTrigger value="form">Form Config</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label>Page Title</Label>
              <Input
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Textarea
                value={config.subtitle}
                onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                rows={2}
              />
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
                storagePath="parties"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Party Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Party Types</Label>
                  <Input
                    value={config.details.partyTypes}
                    onChange={(e) => setConfig({
                      ...config,
                      details: { ...config.details, partyTypes: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Group Size</Label>
                  <Input
                    value={config.details.groupSize}
                    onChange={(e) => setConfig({
                      ...config,
                      details: { ...config.details, groupSize: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    value={config.details.duration}
                    onChange={(e) => setConfig({
                      ...config,
                      details: { ...config.details, duration: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={config.details.location}
                    onChange={(e) => setConfig({
                      ...config,
                      details: { ...config.details, location: e.target.value }
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <h3 className="text-lg font-semibold">Party Options</h3>
            {config.partyOptions.map((option, optIndex) => (
              <Card key={option.id}>
                <CardHeader>
                  <CardTitle className="text-base">{option.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={option.title}
                        onChange={(e) => updatePartyOption(optIndex, 'title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <Select
                        value={option.icon}
                        onValueChange={(value) => updatePartyOption(optIndex, 'icon', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TreePine">TreePine</SelectItem>
                          <SelectItem value="Home">Home</SelectItem>
                          <SelectItem value="Moon">Moon</SelectItem>
                          <SelectItem value="PartyPopper">PartyPopper</SelectItem>
                          <SelectItem value="Gift">Gift</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea
                      value={option.shortDescription}
                      onChange={(e) => updatePartyOption(optIndex, 'shortDescription', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Full Description</Label>
                    <Textarea
                      value={option.fullDescription}
                      onChange={(e) => updatePartyOption(optIndex, 'fullDescription', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Features</Label>
                      <Button variant="outline" size="sm" onClick={() => addPartyOptionFeature(optIndex)}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                    {option.features.map((feature, featIndex) => (
                      <div key={featIndex} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updatePartyOptionFeature(optIndex, featIndex, e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePartyOptionFeature(optIndex, featIndex)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Ideal For</Label>
                    <Input
                      value={option.idealFor}
                      onChange={(e) => updatePartyOption(optIndex, 'idealFor', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Note (optional)</Label>
                    <Input
                      value={option.note || ''}
                      onChange={(e) => updatePartyOption(optIndex, 'note', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="extras" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">What's Included</CardTitle>
                <Button variant="outline" size="sm" onClick={addIncludedItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {config.whatsIncluded.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateIncludedItem(index, e.target.value)}
                      placeholder="Enter included item"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIncludedItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Popular Add-Ons</CardTitle>
                <Button variant="outline" size="sm" onClick={addAddOn}>
                  <Plus className="h-4 w-4 mr-1" /> Add Add-On
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {config.addOns.map((addon, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Select
                      value={addon.icon}
                      onValueChange={(value) => updateAddOn(index, 'icon', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cake">Cake</SelectItem>
                        <SelectItem value="Camera">Camera</SelectItem>
                        <SelectItem value="Star">Star</SelectItem>
                        <SelectItem value="Gift">Gift</SelectItem>
                        <SelectItem value="Music">Music</SelectItem>
                        <SelectItem value="Sparkles">Sparkles</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={addon.text}
                      onChange={(e) => updateAddOn(index, 'text', e.target.value)}
                      placeholder="Add-on description"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAddOn(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
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
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
