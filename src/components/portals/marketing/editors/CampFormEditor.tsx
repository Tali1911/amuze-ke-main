import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cmsService } from '@/services/cmsService';


interface CampFormEditorProps {
  isOpen: boolean;
  onClose: () => void;
  formSlug: string | null;
  onSave: () => void;
}

export const CampFormEditor: React.FC<CampFormEditorProps> = ({ isOpen, onClose, formSlug, onSave }) => {
  const [formData, setFormData] = useState({
    pricing: {
      halfDayRate: 1500,
      fullDayRate: 2500,
      currency: 'KES',
      ngongDayRate: 2000
    },
    fields: {
      parentName: { label: 'Parent/Guardian Name', placeholder: 'Enter your full name', required: true },
      childName: { label: "Child's Full Name", placeholder: "Enter child's full name", required: true },
      dateOfBirth: { label: 'Date of Birth', placeholder: 'Select date', required: true },
      ageRange: { label: 'Age Range', placeholder: 'Select age range', required: true },
      numberOfDays: { label: 'Number of Days', placeholder: 'Enter number of days (1-60)', helpText: 'Enter how many days you want to register for' },
      sessionType: { label: 'Session Type', halfDayLabel: 'Half Day (8AM-12PM)', fullDayLabel: 'Full Day (8AM-5PM)' },
      specialNeeds: { label: 'Special Needs/Medical Information', placeholder: 'Please describe any special needs, allergies, or medical conditions' },
      emergencyContact: { label: 'Emergency Contact Name', placeholder: 'Enter emergency contact name', required: true },
      email: { label: 'Email Address', placeholder: 'your.email@example.com', required: true },
      phone: { label: 'Phone Number', placeholder: '+254 XXX XXX XXX', required: true }
    },
    buttons: {
      registerOnly: 'Register Only',
      registerAndPay: 'Register & Pay Now',
      addChild: 'Add Another Child',
      removeChild: 'Remove'
    },
    messages: {
      registrationSuccess: "Registration submitted successfully! We'll contact you shortly.",
      registrationError: 'Failed to submit registration. Please try again.',
      chooseOption: 'Choose your registration option:',
      paymentComingSoon: 'Payment integration coming soon. Both options will complete your registration.'
    },
    specialNeedsSection: {
      title: 'Special Needs & Medical Information',
      description: 'Please provide any information about allergies, medical conditions, or special accommodations needed.'
    },
    availableDates: [] as string[],
    locations: ['Kurura Gate F', 'Ngong Sanctuary'] as string[],
    archeryRate: 1000,
    emailContent: {
      karura: {
        timing: 'Full Day: 9:00 AM - 3:00 PM / Half Day: 9:00 AM - 1:00 PM',
        activities: ['Nature exploration', 'Adventure activities', 'Team games', 'Creative crafts', 'Environmental education'],
        whatToBring: ['Comfortable clothes', 'Closed shoes', 'Water bottle', 'Sunscreen', 'Packed lunch (full day)']
      },
      ngong: {
        timing: '9:00 AM - 1:00 PM',
        activities: ['Archery', 'Outdoor exploration', 'Team-building activities', 'Creative workshops', 'Nature walks', 'Group games', 'Environmental education'],
        whatToBring: ['Comfortable clothes', 'Closed shoes', 'Water bottle', 'Sunscreen', 'Packed snack']
      }
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    if (formSlug && isOpen) {
      loadFormData();
    }
  }, [formSlug, isOpen]);

  const loadFormData = async () => {
    if (!formSlug) return;
    
    const data = await cmsService.getCampFormConfig(formSlug.replace('-form', ''));
    if (data?.metadata?.formConfig) {
      setFormData({
        ...formData,
        ...data.metadata.formConfig,
        specialNeedsSection: {
          ...formData.specialNeedsSection,
          ...(data.metadata.formConfig.specialNeedsSection || {})
        },
        availableDates: data.metadata.formConfig.availableDates || [],
        locations: data.metadata.formConfig.locations || ['Kurura Gate F', 'Ngong Sanctuary'],
        archeryRate: data.metadata.formConfig.archeryRate || 1000,
        emailContent: {
          karura: {
            ...formData.emailContent.karura,
            ...(data.metadata.formConfig.emailContent?.karura || {})
          },
          ngong: {
            ...formData.emailContent.ngong,
            ...(data.metadata.formConfig.emailContent?.ngong || {})
          }
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formType = formSlug?.replace('-form', '') || '';
      
      const result = await cmsService.updateCampFormConfig(formType, formData);
      
      if (result) {
        toast.success('Camp form updated successfully');
        onSave();
        onClose();
      } else {
        toast.error('Failed to update camp form - please check permissions');
      }
    } catch (error) {
      console.error('Error saving camp form:', error);
      toast.error('Failed to update camp form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Camp Form Configuration</DialogTitle>
          <DialogDescription>Customize all form labels, pricing, and messages</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="pricing" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="dates">Dates</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="email">Email Content</TabsTrigger>
            </TabsList>

            <TabsContent value="pricing" className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="halfDayRate">Half Day Rate</Label>
                  <Input
                    id="halfDayRate"
                    type="number"
                    value={formData.pricing.halfDayRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, halfDayRate: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="fullDayRate">Full Day Rate</Label>
                  <Input
                    id="fullDayRate"
                    type="number"
                    value={formData.pricing.fullDayRate}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, fullDayRate: Number(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={formData.pricing.currency}
                    onChange={(e) => setFormData({
                      ...formData,
                      pricing: { ...formData.pricing, currency: e.target.value }
                    })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dates" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    📅 Dates are now synced from the Calendar
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Camp dates are automatically pulled from your Calendar events. When you create or edit a calendar event with a matching program type, the registration form will show those dates automatically.
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Past dates are automatically hidden from registration forms but remain visible in the calendar.
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Per-location scheduling:</strong> Dates are now scoped to the location set on each calendar event. If Karura and Ngong run the same camp on different dates (or one starts months later), add <em>one calendar event per location</em> with the matching <strong>Location</strong> field. The registration form will show only the dates for the location the parent picks.
                  </p>
                  <p className="text-sm font-medium text-primary">
                    To manage dates → go to the <strong>Calendar</strong> tab and create/edit events with the correct program type <em>and</em> location.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4 pt-4">
              <div>
                <h4 className="font-medium mb-2">Available Locations</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage the locations available for registration. These appear as a dropdown on the registration forms.
                </p>
              </div>

              <div className="space-y-2">
                {formData.locations.map((loc, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={loc}
                      onChange={(e) => {
                        const updated = [...formData.locations];
                        updated[index] = e.target.value;
                        setFormData({ ...formData, locations: updated });
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = formData.locations.filter((_, i) => i !== index);
                        setFormData({ ...formData, locations: updated });
                      }}
                      disabled={formData.locations.length <= 1}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="New location name"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newLocation.trim()) {
                        e.preventDefault();
                        setFormData({ ...formData, locations: [...formData.locations, newLocation.trim()] });
                        setNewLocation('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (newLocation.trim()) {
                        setFormData({ ...formData, locations: [...formData.locations, newLocation.trim()] });
                        setNewLocation('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Ngong Sanctuary Day Rate</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Flat rate per day when Ngong Sanctuary is selected (no half/full day distinction).
                </p>
                <Input
                  type="number"
                  value={formData.pricing.ngongDayRate || 2000}
                  onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, ngongDayRate: Number(e.target.value) } })}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Archery Rate (Ngong Sanctuary)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Price per archery session (45 mins) when Ngong Sanctuary is selected.
                </p>
                <Input
                  type="number"
                  value={formData.archeryRate}
                  onChange={(e) => setFormData({ ...formData, archeryRate: Number(e.target.value) })}
                />
              </div>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4 pt-4">
              {Object.entries(formData.fields).map(([key, field]) => (
                <div key={key} className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`${key}-label`}>Label</Label>
                      <Input
                        id={`${key}-label`}
                        value={field.label}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: {
                            ...formData.fields,
                            [key]: { ...field, label: e.target.value }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${key}-placeholder`}>Placeholder</Label>
                      <Input
                        id={`${key}-placeholder`}
                        value={'placeholder' in field ? field.placeholder : ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: {
                            ...formData.fields,
                            [key]: { ...field, placeholder: e.target.value }
                          }
                        })}
                      />
                    </div>
                  </div>
                  {'helpText' in field && field.helpText && (
                    <div>
                      <Label htmlFor={`${key}-help`}>Help Text</Label>
                      <Input
                        id={`${key}-help`}
                        value={field.helpText}
                        onChange={(e) => setFormData({
                          ...formData,
                          fields: {
                            ...formData.fields,
                            [key]: { ...field, helpText: e.target.value }
                          }
                        })}
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
                    value={value}
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
                    value={value}
                    onChange={(e) => setFormData({
                      ...formData,
                      messages: { ...formData.messages, [key]: e.target.value }
                    })}
                    rows={2}
                  />
                </div>
              ))}

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Special Needs Section</h4>
                <div>
                  <Label htmlFor="special-title">Title</Label>
                  <Input
                    id="special-title"
                    value={formData.specialNeedsSection.title}
                    onChange={(e) => setFormData({
                      ...formData,
                      specialNeedsSection: { ...formData.specialNeedsSection, title: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="special-desc">Description</Label>
                  <Textarea
                    id="special-desc"
                    value={formData.specialNeedsSection.description}
                    onChange={(e) => setFormData({
                      ...formData,
                      specialNeedsSection: { ...formData.specialNeedsSection, description: e.target.value }
                    })}
                    rows={2}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-6 pt-4">
              <p className="text-sm text-muted-foreground">
                Customise the camp information shown in confirmation emails for each location. These details appear in the "Camp Information" section of the email.
              </p>

              {/* Karura Gate F */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-primary">Karura Gate F — Email Details</h4>
                <div>
                  <Label>Timing</Label>
                  <Input
                    value={formData.emailContent.karura.timing}
                    onChange={(e) => setFormData({
                      ...formData,
                      emailContent: { ...formData.emailContent, karura: { ...formData.emailContent.karura, timing: e.target.value } }
                    })}
                  />
                </div>
                <div>
                  <Label>Activities (comma-separated)</Label>
                  <Textarea
                    value={formData.emailContent.karura.activities.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      emailContent: { ...formData.emailContent, karura: { ...formData.emailContent.karura, activities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }
                    })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>What to Bring (comma-separated)</Label>
                  <Textarea
                    value={formData.emailContent.karura.whatToBring.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      emailContent: { ...formData.emailContent, karura: { ...formData.emailContent.karura, whatToBring: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }
                    })}
                    rows={2}
                  />
                </div>
              </div>

              {/* Ngong Sanctuary */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-primary">Ngong Sanctuary — Email Details</h4>
                <div>
                  <Label>Timing</Label>
                  <Input
                    value={formData.emailContent.ngong.timing}
                    onChange={(e) => setFormData({
                      ...formData,
                      emailContent: { ...formData.emailContent, ngong: { ...formData.emailContent.ngong, timing: e.target.value } }
                    })}
                  />
                </div>
                <div>
                  <Label>Activities (comma-separated)</Label>
                  <Textarea
                    value={formData.emailContent.ngong.activities.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      emailContent: { ...formData.emailContent, ngong: { ...formData.emailContent.ngong, activities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }
                    })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>What to Bring (comma-separated)</Label>
                  <Textarea
                    value={formData.emailContent.ngong.whatToBring.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      emailContent: { ...formData.emailContent, ngong: { ...formData.emailContent.ngong, whatToBring: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }
                    })}
                    rows={2}
                  />
                </div>
              </div>
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
