
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Feature, 
  getFeatures, 
  toggleFeature, 
  setLocalFeature, 
  getLocalFeature 
} from "@/services/featuresService";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const FeaturesManagement = () => {
  const [featureStates, setFeatureStates] = useState({
    galleryEnabled: true,
    testimonialsEnabled: true,
    blogEnabled: false,
    showRecruitment: false,
  });
  
  const queryClient = useQueryClient();
  
  // Add a staleTime and cacheTime to prevent unnecessary refetches
  const { 
    data: apiFeatures, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['features'],
    queryFn: getFeatures,
    staleTime: 60000, // 1 minute
    retry: 1, // Only retry once
  });

  // Setup separate effect to handle the success callback functionality
  useEffect(() => {
    if (apiFeatures && apiFeatures.length > 0) {
      const newFeatureStates = { ...featureStates };
      
      apiFeatures.forEach(feature => {
        newFeatureStates[feature.key] = feature.enabled;
      });
      
      setFeatureStates(newFeatureStates);
    }
  }, [apiFeatures]);

  // Setup separate effect to handle error fallback
  useEffect(() => {
    if (error) {
      console.log("Error loading features, using local storage:", error);
      loadFromLocalStorage();
    }
  }, [error]);
  
  // Setup mutation for toggling features with optimistic updates
  const toggleFeatureMutation = useMutation({
    mutationFn: (id: string) => toggleFeature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
    onError: (error) => {
      console.error("API error, falling back to localStorage:", error);
    }
  });

  const loadFromLocalStorage = () => {
    try {
      setFeatureStates({
        galleryEnabled: getLocalFeature('galleryEnabled', true),
        testimonialsEnabled: getLocalFeature('testimonialsEnabled', true),
        blogEnabled: getLocalFeature('blogEnabled', false),
        showRecruitment: getLocalFeature('showRecruitment', false),
      });
    } catch (error) {
      console.error("Failed to load features from localStorage:", error);
    }
  };

  const handleFeatureToggle = async (feature, value) => {
    // Optimistically update UI state
    setFeatureStates(prev => ({ ...prev, [feature]: value }));
    
    try {
      // First set in localStorage as fallback
      setLocalFeature(feature, value);
      
      // If we have API features, find the matching one and toggle it
      if (apiFeatures && apiFeatures.length > 0) {
        const apiFeature = apiFeatures.find(f => f.key === feature);
        if (apiFeature) {
          await toggleFeatureMutation.mutateAsync(apiFeature._id);
        }
      }
      
      toast({
        title: `${value ? 'Enabled' : 'Disabled'} ${getFeatureDisplayName(feature)}`,
        description: `The ${getFeatureDisplayName(feature).toLowerCase()} feature has been ${value ? 'enabled' : 'disabled'}.`,
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to toggle feature:", error);
      
      // Revert UI state on error
      setFeatureStates(prev => ({ ...prev, [feature]: !value }));
      
      toast({
        title: "Error Updating Feature",
        description: "Could not update feature settings. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getFeatureDisplayName = (feature) => {
    switch(feature) {
      case 'galleryEnabled': return 'Gallery';
      case 'testimonialsEnabled': return 'Testimonials';
      case 'blogEnabled': return 'Blog';
      case 'showRecruitment': return 'Recruitment Section';
      default: return feature;
    }
  };

  const features = [
    { id: 'galleryEnabled', name: 'Photo Gallery', description: 'Enable or disable the photo gallery on the website.' },
    { id: 'testimonialsEnabled', name: 'Testimonials Section', description: 'Show or hide testimonials from parents and participants.' },
    { id: 'blogEnabled', name: 'Blog', description: 'Enable or disable the blog section (coming soon).' },
    { id: 'showRecruitment', name: 'Recruitment Section', description: 'Show or hide the "Join Our Team" recruitment section.' },
  ];

  return (
    <div className="p-4 border rounded-md">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Feature Management</CardTitle>
        <CardDescription>
          Enable or disable features on the website
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-[60px]" />
                      <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {features.map((feature) => (
              <Card key={feature.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-medium">{feature.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={feature.id}>
                        {featureStates[feature.id] ? 'Enabled' : 'Disabled'}
                      </Label>
                      <Switch
                        id={feature.id}
                        checked={featureStates[feature.id]}
                        onCheckedChange={(value) => handleFeatureToggle(feature.id, value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
};

export default FeaturesManagement;
