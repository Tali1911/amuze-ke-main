import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cmsService } from '@/services/cmsService';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import MediaUploader from './MediaUploader';
import { LocationDetail } from '@/hooks/useCampPageConfig';

interface CampPageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  campSlug: string | null;
  onSave: () => void;
}

const emptyLocationDetail = (): LocationDetail => ({
  name: '',
  duration: '',
  ageGroup: '',
  time: '',
  highlights: ['']
});

export const CampPageEditor: React.FC<CampPageEditorProps> = ({ isOpen, onClose, campSlug, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    heroImage: '',
    mediaType: 'photo' as 'photo' | 'video',
    mediaUrl: '',
    videoThumbnail: '',
    mediaAltText: '',
    duration: '',
    ageGroup: '',
    location: '',
    time: '',
    highlights: [''],
    locationDetails: [] as LocationDetail[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLocations, setExpandedLocations] = useState<number[]>([0]);

  useEffect(() => {
    if (campSlug && isOpen) {
      loadCampData();
    }
  }, [campSlug, isOpen]);

  const loadCampData = async () => {
    if (!campSlug) return;
    
    const data = await cmsService.getCampPageConfig(campSlug.replace('-page', ''));
    if (data?.metadata?.pageConfig) {
      const config = data.metadata.pageConfig;
      setFormData({
        title: config.title || '',
        description: config.description || '',
        heroImage: config.heroImage || '',
        mediaType: config.mediaType || 'photo',
        mediaUrl: config.mediaUrl || '',
        videoThumbnail: config.videoThumbnail || '',
        mediaAltText: config.mediaAltText || '',
        duration: config.duration || '',
        ageGroup: config.ageGroup || '',
        location: config.location || '',
        time: config.time || '',
        highlights: config.highlights || [''],
        locationDetails: config.locationDetails || []
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const campType = campSlug?.replace('-page', '') || '';
      const result = await cmsService.updateCampPageConfig(campType, formData);
      
      if (result) {
        toast.success('Camp page updated successfully');
        onSave();
        onClose();
      } else {
        toast.error('Failed to update camp page - please check permissions');
      }
    } catch (error) {
      console.error('Error saving camp page:', error);
      toast.error('Failed to update camp page');
    } finally {
      setIsLoading(false);
    }
  };

  const addHighlight = () => {
    setFormData({ ...formData, highlights: [...formData.highlights, ''] });
  };

  const removeHighlight = (index: number) => {
    const newHighlights = formData.highlights.filter((_, i) => i !== index);
    setFormData({ ...formData, highlights: newHighlights });
  };

  const updateHighlight = (index: number, value: string) => {
    const newHighlights = [...formData.highlights];
    newHighlights[index] = value;
    setFormData({ ...formData, highlights: newHighlights });
  };

  // Location Details handlers
  const addLocationDetail = () => {
    const newDetails = [...formData.locationDetails, emptyLocationDetail()];
    setFormData({ ...formData, locationDetails: newDetails });
    setExpandedLocations([...expandedLocations, newDetails.length - 1]);
  };

  const removeLocationDetail = (index: number) => {
    const newDetails = formData.locationDetails.filter((_, i) => i !== index);
    setFormData({ ...formData, locationDetails: newDetails });
    setExpandedLocations(expandedLocations.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  };

  const updateLocationDetail = (index: number, field: keyof LocationDetail, value: any) => {
    const newDetails = [...formData.locationDetails];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setFormData({ ...formData, locationDetails: newDetails });
  };

  const addLocationHighlight = (locIndex: number) => {
    const newDetails = [...formData.locationDetails];
    newDetails[locIndex] = { ...newDetails[locIndex], highlights: [...newDetails[locIndex].highlights, ''] };
    setFormData({ ...formData, locationDetails: newDetails });
  };

  const removeLocationHighlight = (locIndex: number, hlIndex: number) => {
    const newDetails = [...formData.locationDetails];
    newDetails[locIndex] = { ...newDetails[locIndex], highlights: newDetails[locIndex].highlights.filter((_, i) => i !== hlIndex) };
    setFormData({ ...formData, locationDetails: newDetails });
  };

  const updateLocationHighlight = (locIndex: number, hlIndex: number, value: string) => {
    const newDetails = [...formData.locationDetails];
    const newHighlights = [...newDetails[locIndex].highlights];
    newHighlights[hlIndex] = value;
    newDetails[locIndex] = { ...newDetails[locIndex], highlights: newHighlights };
    setFormData({ ...formData, locationDetails: newDetails });
  };

  const toggleLocationExpanded = (index: number) => {
    setExpandedLocations(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Camp Page Content</DialogTitle>
          <DialogDescription>Customize the camp page hero section, details, and location-specific information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Camp Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Easter Camp"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A brief description of the camp..."
              rows={4}
              required
            />
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <Label className="text-base font-medium mb-4 block">Featured Media</Label>
            <MediaUploader
              mediaType={formData.mediaType}
              mediaUrl={formData.mediaUrl || formData.heroImage}
              thumbnailUrl={formData.videoThumbnail}
              onMediaTypeChange={(type) => setFormData({ ...formData, mediaType: type })}
              onMediaUrlChange={(url) => setFormData({ ...formData, mediaUrl: url, heroImage: url })}
              onThumbnailUrlChange={(url) => setFormData({ ...formData, videoThumbnail: url })}
              storagePath="camps"
            />
            <div className="mt-4">
              <Label htmlFor="mediaAltText">Alt Text (for accessibility)</Label>
              <Input
                id="mediaAltText"
                value={formData.mediaAltText}
                onChange={(e) => setFormData({ ...formData, mediaAltText: e.target.value })}
                placeholder="Describe the media for screen readers"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (default) *</Label>
              <Input id="duration" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="5 Days" required />
            </div>
            <div>
              <Label htmlFor="ageGroup">Age Group (default) *</Label>
              <Input id="ageGroup" value={formData.ageGroup} onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })} placeholder="4-12 years" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location (default) *</Label>
              <Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Amuse Nature Experience Center" required />
            </div>
            <div>
              <Label htmlFor="time">Time (default) *</Label>
              <Input id="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} placeholder="8:00 AM - 5:00 PM" required />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Default Camp Highlights *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addHighlight}>
                <Plus className="w-4 h-4 mr-1" /> Add Highlight
              </Button>
            </div>
            <div className="space-y-2">
              {formData.highlights.map((highlight, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={highlight} onChange={(e) => updateHighlight(index, e.target.value)} placeholder="Easter egg hunts in nature" required />
                  {formData.highlights.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeHighlight(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Location-specific Details */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-base font-medium">Location-Specific Details</Label>
                <p className="text-sm text-muted-foreground">Add details for each location. These appear as expandable sections on the camp page.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addLocationDetail}>
                <Plus className="w-4 h-4 mr-1" /> Add Location
              </Button>
            </div>

            <div className="space-y-3">
              {formData.locationDetails.map((loc, locIndex) => (
                <div key={locIndex} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer"
                    onClick={() => toggleLocationExpanded(locIndex)}
                  >
                    <span className="font-medium text-sm">{loc.name || `Location ${locIndex + 1}`}</span>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); removeLocationDetail(locIndex); }}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      {expandedLocations.includes(locIndex) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {expandedLocations.includes(locIndex) && (
                    <div className="p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Location Name *</Label>
                          <Input value={loc.name} onChange={(e) => updateLocationDetail(locIndex, 'name', e.target.value)} placeholder="Karura Gate F" className="mt-1" required />
                        </div>
                        <div>
                          <Label className="text-xs">Duration *</Label>
                          <Input value={loc.duration} onChange={(e) => updateLocationDetail(locIndex, 'duration', e.target.value)} placeholder="5 Days" className="mt-1" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Age Group *</Label>
                          <Input value={loc.ageGroup} onChange={(e) => updateLocationDetail(locIndex, 'ageGroup', e.target.value)} placeholder="4-12 years" className="mt-1" required />
                        </div>
                        <div>
                          <Label className="text-xs">Time *</Label>
                          <Input value={loc.time} onChange={(e) => updateLocationDetail(locIndex, 'time', e.target.value)} placeholder="9:00 AM - 1:00 PM" className="mt-1" required />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs">Highlights</Label>
                          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => addLocationHighlight(locIndex)}>
                            <Plus className="w-3 h-3 mr-1" /> Add
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {loc.highlights.map((hl, hlIndex) => (
                            <div key={hlIndex} className="flex gap-1">
                              <Input value={hl} onChange={(e) => updateLocationHighlight(locIndex, hlIndex, e.target.value)} placeholder="Activity highlight" className="text-sm" />
                              {loc.highlights.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeLocationHighlight(locIndex, hlIndex)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
