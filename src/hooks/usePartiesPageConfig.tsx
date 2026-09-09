import { useState, useEffect, useCallback } from 'react';
import { cmsService } from '@/services/cmsService';

export interface PartyOption {
  id: string;
  title: string;
  icon: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  idealFor: string;
  note?: string;
}

export interface AddOn {
  icon: string;
  text: string;
}

export interface PartiesPageConfig {
  title: string;
  subtitle: string;
  description: string;
  featuredMediaUrl: string;
  mediaType: 'photo' | 'video';
  videoThumbnail?: string;
  partyOptions: PartyOption[];
  details: {
    partyTypes: string;
    groupSize: string;
    duration: string;
    location: string;
  };
  whatsIncluded: string[];
  addOns: AddOn[];
  formConfig: {
    formTitle: string;
    ctaText: string;
    fields: Record<string, { label: string; placeholder?: string; helpText?: string }>;
    buttons: Record<string, string>;
    messages: Record<string, string>;
  };
  metaTitle: string;
  metaDescription: string;
}

const defaultPartyOptions: PartyOption[] = [
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
    note: 'In line with forest guidelines, no single-use plastics are allowed, and our team will help handle all forest logistics on your behalf—so you can relax and enjoy the celebration.'
  },
  {
    id: 'we-come-to-you',
    title: 'We Come to You',
    icon: 'Home',
    shortDescription: 'No need to travel—we can bring the adventure to your chosen location!',
    fullDescription: 'No need to travel—we can bring the adventure to your chosen location! Our team sets up fun, engaging, and safe outdoor activities wherever you are, with full facilitation and equipment provided for stress-free planning.',
    features: [
      'Our team sets up fun, engaging, and safe outdoor activities wherever you are',
      'Ideal for home gardens, schools, or community spaces',
      'Activities can be customized for your child\'s age, interests, and group size',
      'Full facilitation and equipment provided, so you can enjoy stress-free planning'
    ],
    idealFor: 'Perfect for families looking for outdoor birthday parties without leaving home.'
  },
  {
    id: 'overnight-camping',
    title: 'Overnight Camping (Preteens & Teens)',
    icon: 'Moon',
    shortDescription: 'Take your child\'s birthday to the next level with an immersive overnight adventure.',
    fullDescription: 'Take your child\'s birthday to the next level with an immersive overnight adventure. We offer flexible locations: you can host a backyard camping party at your home, use a shared clubhouse or school compound, or venture into nature for a full wilderness experience.',
    features: [
      'Sleep in spacious tents and enjoy hands-on adventure activities like archery, orienteering, and bushcraft',
      'Bond with friends through night activities, campfire stories, and outdoor movie nights under the stars',
      'Build life skills including independence, teamwork, resilience, and problem-solving while having the time of their lives'
    ],
    idealFor: 'Perfect for preteens and teenagers seeking a memorable, adventurous birthday celebration beyond the ordinary.'
  }
];

const defaultConfig: PartiesPageConfig = {
  title: 'Parties & Celebrations',
  subtitle: 'Customised parties and team-building events with a focus on fun and tangible outcomes.',
  description: 'Make your special occasion extraordinary! Our outdoor party packages combine nature, adventure, and celebration for birthday parties, family gatherings, and group events.',
  featuredMediaUrl: '',
  mediaType: 'photo',
  partyOptions: defaultPartyOptions,
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
  metaDescription: 'Host unforgettable birthday parties and celebrations at Karura Forest, at your venue, or as an overnight camping experience. Outdoor adventure parties for all ages.'
};

export const usePartiesPageConfig = () => {
  const [config, setConfig] = useState<PartiesPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load from experience_page content type
      const content = await cmsService.getContentBySlug('parties-page', 'experience_page');
      
      if (content?.metadata?.pageConfig) {
        setConfig({ ...defaultConfig, ...content.metadata.pageConfig });
      } else {
        setConfig(defaultConfig);
      }
    } catch (err) {
      console.error('Error loading parties config:', err);
      setError('Failed to load configuration');
      setConfig(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    
    const handleCmsUpdate = () => loadConfig();
    window.addEventListener('cms-content-updated', handleCmsUpdate);
    
    return () => window.removeEventListener('cms-content-updated', handleCmsUpdate);
  }, [loadConfig]);

  return { config, isLoading, error, refresh: loadConfig };
};
