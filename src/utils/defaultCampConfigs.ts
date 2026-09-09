import { CampPageConfig } from '@/hooks/useCampPageConfig';
import { CampFormConfig } from '@/hooks/useCampFormConfig';

const NGONG_LOCATION_DETAIL = {
  name: 'Ngong Sanctuary',
  duration: '5 Days',
  ageGroup: '4-15 years',
  time: '9:00 AM - 1:00 PM',
  highlights: ['Archery', 'Outdoor exploration', 'Team-building activities', 'Creative workshops', 'Nature walks', 'Group games', 'Environmental education']
};

// Default camp page configurations
export const defaultCampPageConfigs: Record<string, CampPageConfig> = {
  'easter': {
    title: 'Easter Camp',
    description: 'Experience an egg-citing Easter adventure filled with nature exploration, creative activities, and outdoor fun!',
    heroImage: '/src/assets/camping.jpg',
    duration: '5 Days',
    ageGroup: '4-12 years',
    location: 'Amuse Nature Experience Center',
    time: '8:00 AM - 5:00 PM',
    highlights: [
      'Easter egg hunts in nature',
      'Wildlife exploration and bird watching',
      'Creative arts and crafts',
      'Outdoor games and team challenges',
      'Nature scavenger hunts',
      'Storytelling under the trees'
    ],
    locationDetails: [
      {
        name: 'Karura Gate F',
        duration: '5 Days',
        ageGroup: '4-12 years',
        time: '8:00 AM - 5:00 PM',
        highlights: [
          'Easter egg hunts in nature',
          'Wildlife exploration and bird watching',
          'Creative arts and crafts',
          'Outdoor games and team challenges',
          'Nature scavenger hunts',
          'Storytelling under the trees'
        ]
      },
      {
        name: 'Ngong Sanctuary',
        duration: '5 Days',
        ageGroup: '4-15 years',
        time: '9:00 AM - 1:00 PM',
        highlights: [
          'Archery',
          'Outdoor exploration',
          'Team-building activities',
          'Creative workshops',
          'Nature walks',
          'Group games',
          'Environmental education'
        ]
      }
    ]
  },
  'summer': {
    title: 'Summer Camp',
    description: 'Dive into an unforgettable summer adventure! Our Summer Camp offers the perfect blend of outdoor exploration, creative learning, and endless fun.',
    heroImage: '/src/assets/camping.jpg',
    duration: '4-8 Weeks',
    ageGroup: '4-12 years',
    location: 'Amuse Nature Experience Center',
    time: '8:00 AM - 5:00 PM',
    highlights: [
      'Swimming and water activities',
      'Nature trails and camping skills',
      'Sports and team building',
      'Arts, crafts, and music',
      'Science experiments and discovery',
      'Field trips and adventure outings'
    ],
    locationDetails: [
      {
        name: 'Karura Gate F',
        duration: '4-8 Weeks',
        ageGroup: '4-12 years',
        time: '8:00 AM - 5:00 PM',
        highlights: ['Swimming and water activities', 'Nature trails and camping skills', 'Sports and team building', 'Arts, crafts, and music', 'Science experiments and discovery', 'Field trips and adventure outings']
      },
      NGONG_LOCATION_DETAIL
    ]
  },
  'end-year': {
    title: 'End Year Camp',
    description: 'Celebrate the end of the year with an unforgettable outdoor adventure!',
    heroImage: '/src/assets/camping.jpg',
    duration: '5 Days',
    ageGroup: '4-12 years',
    location: 'Amuse Nature Experience Center',
    time: '8:00 AM - 5:00 PM',
    highlights: [
      'Year-end celebration activities',
      'Outdoor adventures and exploration',
      'Team building and group games',
      'Creative workshops',
      'Nature discovery walks',
      'Campfire stories and songs'
    ],
    locationDetails: [
      {
        name: 'Karura Gate F',
        duration: '5 Days',
        ageGroup: '4-12 years',
        time: '8:00 AM - 5:00 PM',
        highlights: ['Year-end celebration activities', 'Outdoor adventures and exploration', 'Team building and group games', 'Creative workshops', 'Nature discovery walks', 'Campfire stories and songs']
      },
      NGONG_LOCATION_DETAIL
    ]
  },
  'day-camps': {
    title: 'Day Camps',
    description: 'Join us for exciting daily adventures in nature! Our Day Camps offer flexible scheduling with engaging activities.',
    heroImage: '/src/assets/daily-activities.jpg',
    duration: 'Flexible (1-60 days)',
    ageGroup: '4-12 years',
    location: 'Multiple Locations',
    time: 'Half Day (8AM-12PM) or Full Day (8AM-5PM)',
    highlights: [
      'Flexible scheduling options',
      'Age-appropriate activities',
      'Nature exploration and learning',
      'Indoor and outdoor play',
      'Creative arts and crafts',
      'Healthy snacks and meals'
    ],
    locationDetails: [
      {
        name: 'Karura Gate F',
        duration: 'Flexible (1-60 days)',
        ageGroup: '4-12 years',
        time: 'Half Day (8AM-12PM) or Full Day (8AM-5PM)',
        highlights: ['Flexible scheduling options', 'Age-appropriate activities', 'Nature exploration and learning', 'Indoor and outdoor play', 'Creative arts and crafts', 'Healthy snacks and meals']
      },
      NGONG_LOCATION_DETAIL
    ]
  },
  'mid-term-feb-march': {
    title: 'Mid-Term Camp - Feb/March',
    description: 'Make the most of your mid-term break with outdoor adventures and nature exploration!',
    heroImage: '/src/assets/camping.jpg',
    duration: '5 Days',
    ageGroup: '4-12 years',
    location: 'Amuse Nature Experience Center',
    time: '8:00 AM - 5:00 PM',
    highlights: ['Outdoor exploration', 'Team building activities', 'Creative workshops', 'Nature walks', 'Group games', 'Environmental education'],
    locationDetails: [
      { name: 'Karura Gate F', duration: '5 Days', ageGroup: '4-12 years', time: '8:00 AM - 5:00 PM', highlights: ['Outdoor exploration', 'Team building activities', 'Creative workshops', 'Nature walks', 'Group games', 'Environmental education'] },
      NGONG_LOCATION_DETAIL
    ]
  },
  'mid-term-may-june': {
    title: 'Mid-Term Camp - May/June',
    description: 'Make the most of your mid-term break with outdoor adventures and nature exploration!',
    heroImage: '/src/assets/camping.jpg',
    duration: '5 Days',
    ageGroup: '4-12 years',
    location: 'Amuse Nature Experience Center',
    time: '8:00 AM - 5:00 PM',
    highlights: ['Outdoor exploration', 'Team building activities', 'Creative workshops', 'Nature walks', 'Group games', 'Environmental education'],
    locationDetails: [
      { name: 'Karura Gate F', duration: '5 Days', ageGroup: '4-12 years', time: '8:00 AM - 5:00 PM', highlights: ['Outdoor exploration', 'Team building activities', 'Creative workshops', 'Nature walks', 'Group games', 'Environmental education'] },
      NGONG_LOCATION_DETAIL
    ]
  },
  'mid-term-october': {
    title: 'Mid-Term Camp - October',
    description: 'Make the most of your mid-term break with outdoor adventures and nature exploration!',
    heroImage: '/src/assets/camping.jpg',
    duration: '5 Days',
    ageGroup: '4-12 years',
    location: 'Amuse Nature Experience Center',
    time: '8:00 AM - 5:00 PM',
    highlights: ['Outdoor exploration', 'Team building activities', 'Creative workshops', 'Nature walks', 'Group games', 'Environmental education'],
    locationDetails: [
      { name: 'Karura Gate F', duration: '5 Days', ageGroup: '4-12 years', time: '8:00 AM - 5:00 PM', highlights: ['Outdoor exploration', 'Team building activities', 'Creative workshops', 'Nature walks', 'Group games', 'Environmental education'] },
      NGONG_LOCATION_DETAIL
    ]
  }
};

// Default camp form configurations
const DEFAULT_LOCATIONS = ['Kurura Gate F', 'Ngong Sanctuary'];
const DEFAULT_ARCHERY_RATE = 1000; // KES per 45-min session

const baseFormConfig: Omit<CampFormConfig, 'ageGroups'> = {
  pricing: {
    halfDayRate: 1500,
    fullDayRate: 2500,
    currency: 'KES',
    ngongDayRate: 2000
  },
  locations: DEFAULT_LOCATIONS,
  archeryRate: DEFAULT_ARCHERY_RATE,
  fields: {
    parentName: { label: 'Parent/Guardian Name', placeholder: 'Enter your full name', required: true },
    childName: { label: "Child's Full Name", placeholder: "Enter child's full name", required: true },
    dateOfBirth: { label: 'Date of Birth', placeholder: 'Select date', required: true },
    ageRange: { label: 'Age Range', placeholder: 'Select age range', required: true },
    numberOfDays: { label: 'Number of Days', placeholder: 'Enter number of days', helpText: 'Enter how many days you want to register for' },
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
  }
};

export const defaultCampFormConfigs: Record<string, CampFormConfig> = {
  'easter': { 
    ...baseFormConfig,
    sessionDates: {
      startDate: '2025-04-14',
      endDate: '2025-04-18'
    }
  },
  'summer': { 
    ...baseFormConfig,
    sessionDates: {
      startDate: '2025-06-02',
      endDate: '2025-07-25'
    }
  },
  'end-year': { 
    ...baseFormConfig,
    sessionDates: {
      startDate: '2025-12-08',
      endDate: '2025-12-12'
    }
  },
  'mid-term': { 
    ...baseFormConfig,
    sessionDates: {
      startDate: '2025-10-20',
      endDate: '2025-10-24'
    }
  },
  'mid-term-feb-march': { 
    ...baseFormConfig,
    sessionDates: {
      startDate: '2025-02-17',
      endDate: '2025-02-21'
    }
  },
  'mid-term-may-june': { 
    ...baseFormConfig,
    sessionDates: {
      startDate: '2025-05-26',
      endDate: '2025-05-30'
    }
  },
  'mid-term-october': { 
    ...baseFormConfig,
    sessionDates: {
      startDate: '2025-10-20',
      endDate: '2025-10-24'
    }
  },
  'holiday-camp': {
    ...baseFormConfig,
    sessionDates: {
      startDate: '2025-04-14',
      endDate: '2025-04-18'
    }
  },
  'day-camps': {
    ...baseFormConfig,
    sessionDates: {
      startDate: '2025-06-02',
      endDate: '2025-07-25'
    },
    ageGroups: [
      {
        age: '4-5 years',
        locations: 'Amuse Farm, Lavington Green',
        schedule: 'Half Day & Full Day options',
        skills: 'Basic motor skills, social interaction, nature introduction',
        color: 'bg-green-50'
      },
      {
        age: '6-8 years',
        locations: 'Amuse Farm, Lavington Green, Ridgeways',
        schedule: 'Half Day & Full Day options',
        skills: 'Environmental awareness, team building, outdoor exploration',
        color: 'bg-blue-50'
      },
      {
        age: '9-12 years',
        locations: 'All locations',
        schedule: 'Half Day & Full Day options',
        skills: 'Advanced nature studies, leadership, conservation projects',
        color: 'bg-purple-50'
      }
    ]
  }
};
