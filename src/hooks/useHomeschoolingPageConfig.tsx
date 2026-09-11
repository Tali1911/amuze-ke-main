import { useState, useEffect, useCallback } from 'react';
import { cmsService } from '@/services/cmsService';

export interface HomeschoolingPackage {
  id: string;
  name: string;
  frequency: string;
  price: string;
  /** Numeric price used to compute a per-session total for the registration. */
  pricePerSession?: number;
  /** Weekdays this package runs on (0 = Sunday ... 6 = Saturday). */
  days?: number[];
  /** Whether families choose one of the weekdays (Explorers) or attend all of them (Adventure). */
  dayChoice?: 'single' | 'all';
  /** Session length recorded on the registration. */
  sessionType?: 'half' | 'full';
  hours?: string;
  description: string;
  features: string[];
}

export interface HomeschoolingSegment {
  title: string;
  blurb: string;
  examples: string[];
}

export interface HomeschoolingPageConfig {
  title: string;
  subtitle: string;
  description: string;
  featuredImage: string;
  packages: HomeschoolingPackage[];
  segments: HomeschoolingSegment[];
  signatureActivity: HomeschoolingSegment;
  commitmentNote: string;
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

const defaultPackages: HomeschoolingPackage[] = [
  {
    id: 'explorers',
    name: 'Explorers Package',
    frequency: 'Once a week — choose either Wednesday or Friday',
    hours: 'Half Day · 9:00 AM – 1:00 PM',
    price: 'KES 2,500/session',
    pricePerSession: 2500,
    days: [3, 5],
    dayChoice: 'single',
    sessionType: 'half',
    description:
      "A single, focused weekly session moving through all five learning segments. Signature activities — like horse riding — are introduced in a fun, exploratory format, making this the natural starting point for families wanting a lighter weekly commitment.",
    features: ['One session a week', 'All five learning segments', 'Exploratory signature activity', 'Age-banded groups'],
  },
  {
    id: 'adventure',
    name: 'Adventure Package',
    frequency: 'Twice a week — Wednesday and Friday',
    hours: 'Full Day · 9:00 AM – 4:00 PM',
    price: 'KES 4,000/session',
    pricePerSession: 4000,
    days: [3, 5],
    dayChoice: 'all',
    sessionType: 'full',
    description:
      "Two sessions a week, each day carrying a different focus, for families who want real skill progression rather than a single weekly taste. Full days include a dedicated 20-minute professional training block for signature activities such as horse riding, run to an actual coaching standard, with the focus rotating between Wednesday and Friday.",
    features: [
      'Two sessions a week',
      'Different focus each day',
      '20-minute professional training block',
      'Real skill progression',
    ],
  },
];

const defaultSegments: HomeschoolingSegment[] = [
  {
    title: 'Outdoor & Sport Skills',
    blurb: 'Active, coached play that builds fitness, coordination and healthy competition.',
    examples: [
      'Mini football & relay races',
      'Obstacle course circuits',
      'Boot-camp drills',
      'Zumba & movement games',
      'Martial arts basics',
      'Water games',
      'Mini-olympics & team tournaments',
    ],
  },
  {
    title: 'Bushcraft & Survival Skills',
    blurb: 'Guided outdoor education — reading the land, respecting it, and learning to be capable in it.',
    examples: [
      'Nature walks & guided journaling',
      'Plant, tree & insect ID',
      'Animal tracking games',
      'Map reading & orienteering',
      'Knot tying',
      'Weather reading',
      'Shelter-building',
      'Fire safety awareness (supervised)',
    ],
  },
  {
    title: 'Life Skills',
    blurb: 'Practical, character-building lessons that carry far beyond a single session.',
    examples: [
      'Teamwork & communication',
      'Problem-solving games',
      'Basic first aid awareness',
      'Money & saving basics',
      'Gardening & composting',
      'Simple snack/meal prep',
      'Emotional literacy & mindfulness',
      'Public speaking confidence',
    ],
  },
  {
    title: 'Free Play',
    blurb:
      'Genuinely unstructured time with no adult-set agenda, protecting the child-led exploration a fully scheduled day can otherwise crowd out.',
    examples: ['Child-directed outdoor play', 'Open-ended use of natural materials', 'Peer-led games'],
  },
  {
    title: 'Creative Skills',
    blurb: 'Open-ended art, craft and expression using natural and studio materials.',
    examples: [
      'Art & craft (canvas, t-shirt, origami)',
      'Face painting & balloon art',
      'Chess & strategy',
      'Nature photography',
      'Creative writing',
      'Drama & public speaking',
    ],
  },
];

const defaultSignatureActivity: HomeschoolingSegment = {
  title: 'Signature Activity',
  blurb:
    'A standout physical activity — such as horse riding — offered across both packages but delivered differently: a fun, exploratory format for Explorers, and a dedicated 20-minute professional training block for Adventure, with the focus rotating between Wednesday and Friday.',
  examples: ['Horse riding', 'Archery (select venues)', 'Mountain biking (select venues)'],
};

const defaultConfig: HomeschoolingPageConfig = {
  title: 'Amuse Homeschool — Explorers & Adventure',
  subtitle: 'Nature-based learning & play · Ages 3 & below to 15',
  description:
    "A year-round, nature-based learning programme for homeschool children from age 3 and below through to 15. Every session takes place outdoors, led by trained facilitators, and blends physical activity, hands-on nature education, practical life skills, free play and creative expression. Choose Explorers (once a week) or Adventure (twice a week) — and every month follows a new theme.",
  featuredImage: '',
  packages: defaultPackages,
  segments: defaultSegments,
  signatureActivity: defaultSignatureActivity,
  commitmentNote:
    'Families can switch between packages at term boundaries — talk to our team about moving from Explorers to Adventure as your child is ready for more. Monthly, quarterly and annual commitments unlock a discount, and a further sibling discount applies for additional children. Confirm current per-session pricing with our team when booking.',
  activities: [
    'Horse Riding: Balance, coordination, empathy with animals',
    'Mountain Biking: Endurance, risk assessment, resilience',
    'Camping Experiences: Independence, teamwork, self-reliance',
    'Outdoor Leadership: Communication, decision-making',
    'Bushcraft & Survival: Shelter building, fire safety, nature awareness',
    'Archery: Focus, patience, discipline',
    'Orienteering: Map reading, compass use, navigation',
  ],
  whatsIncluded: [
    'Trained outdoor facilitators',
    'All materials and equipment',
    'Monthly themed programme',
    'Age-banded groups',
    'Insurance coverage',
    'Healthy outdoor snacks',
  ],
  formConfig: {
    fields: {
      parentName: { label: 'Parent/Guardian Name', placeholder: 'Your full name' },
      childName: { label: 'Children', placeholder: "Child's full name" },
      package: { label: 'Preferred Package', placeholder: 'Select a package' },
      sessionDay: { label: 'Preferred Day', helpText: 'Explorers attend once a week — pick Wednesday or Friday' },
      startDate: { label: 'Session Dates', placeholder: 'Choose the dates your child will attend' },
      email: { label: 'Email Address', placeholder: 'Your email' },
      phone: { label: 'Phone Number', placeholder: 'Contact number' },
    },
    buttons: {
      submit: 'Enroll Now',
      back: 'Back to Home',
    },
    messages: {
      successMessage: "Enrollment submitted! We'll contact you to confirm your spot.",
      errorMessage: 'Enrollment failed. Please try again.',
      loadingMessage: 'Processing enrollment...',
    },
  },
  metaTitle: 'Homeschool Programme | Amuse Kenya Outdoor Education',
  metaDescription:
    'Nature-based homeschool programme in Nairobi. Explorers (once a week) and Adventure (twice a week) outdoor learning for ages 3 and below to 15.',
};

export const useHomeschoolingPageConfig = () => {
  const [config, setConfig] = useState<HomeschoolingPageConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const content = await cmsService.getContentBySlug('homeschooling-page', 'experience_page');

      if (content?.metadata?.pageConfig) {
        const saved = content.metadata.pageConfig as Partial<HomeschoolingPageConfig>;
        // Saved configs created before the Explorers/Adventure programme update have no
        // per-session pricing or day metadata — ignore their programme copy so the page
        // never shows the retired packages.
        const isLegacy = !saved.packages?.some((p) => typeof p?.pricePerSession === 'number');
        setConfig({
          ...defaultConfig,
          ...saved,
          ...(isLegacy
            ? {
                title: defaultConfig.title,
                subtitle: defaultConfig.subtitle,
                description: defaultConfig.description,
              }
            : {}),
          // Keep the new programme structure when the saved config predates it.
          packages: !isLegacy && saved.packages?.length ? saved.packages : defaultConfig.packages,
          segments: saved.segments?.length ? saved.segments : defaultConfig.segments,
          signatureActivity: saved.signatureActivity || defaultConfig.signatureActivity,
          formConfig: {
            ...defaultConfig.formConfig,
            ...(saved.formConfig || {}),
            fields: { ...defaultConfig.formConfig.fields, ...(saved.formConfig?.fields || {}) },
            buttons: { ...defaultConfig.formConfig.buttons, ...(saved.formConfig?.buttons || {}) },
            messages: { ...defaultConfig.formConfig.messages, ...(saved.formConfig?.messages || {}) },
          },
        });
      } else {
        setConfig(defaultConfig);
      }
    } catch (err) {
      console.error('Error loading homeschooling config:', err);
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

export const HOMESCHOOLING_DEFAULT_CONFIG = defaultConfig;
