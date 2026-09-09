/**
 * Curated list of internal routes marketers can pick when linking a home page
 * card to an existing page. Extend here without touching the editor UI.
 */
export interface HomeLinkOption {
  value: string; // route path
  label: string; // human-readable label shown in the dropdown
  group?: string;
}

export const HOME_INTERNAL_LINKS: HomeLinkOption[] = [
  { value: '/', label: 'Home', group: 'Core' },
  { value: '/about', label: 'About Us', group: 'Core' },
  { value: '/programs', label: 'All Programs', group: 'Core' },
  { value: '/contact', label: 'Contact', group: 'Core' },
  { value: '/gallery', label: 'Gallery', group: 'Core' },
  { value: '/blog', label: 'Blog', group: 'Core' },
  { value: '/announcements', label: 'Announcements', group: 'Core' },

  { value: '/camp', label: 'Camp Overview', group: 'Camps' },
  { value: '/camps/easter', label: 'Easter Camp', group: 'Camps' },

  { value: '/camps/summer', label: 'Summer Camp', group: 'Camps' },
  { value: '/camps/end-year', label: 'End of Year Camp', group: 'Camps' },
  { value: '/camps/day-camps', label: 'Day Camps', group: 'Camps' },
  { value: '/camps/mid-term/feb-march', label: 'Mid-Term Camp (Feb/March)', group: 'Camps' },
  { value: '/camps/mid-term/may-june', label: 'Mid-Term Camp (May/June)', group: 'Camps' },
  { value: '/camps/mid-term/october', label: 'Mid-Term Camp (October)', group: 'Camps' },

  { value: '/experiences/kenyan-experiences', label: 'Kenyan Experiences', group: 'Experiences' },

  { value: '/group-activities/team-building', label: 'Team Building', group: 'Group Activities' },
  { value: '/group-activities/parties', label: 'Parties', group: 'Group Activities' },

  { value: '/programs/homeschooling', label: 'Homeschooling', group: 'Programs' },
  { value: '/programs/school-experience', label: 'School Adventures', group: 'Programs' },
  { value: '/programs/little-forest', label: 'Little Forest Explorers', group: 'Programs' },
  { value: '/register', label: 'Registration Form', group: 'Programs' },

  { value: '/my-profile', label: 'My Profile', group: 'Account' },
  { value: '/my-registrations', label: 'My Registrations', group: 'Account' },

  { value: '/terms-and-conditions', label: 'Terms & Conditions', group: 'Legal' },
  { value: '/privacy-policy', label: 'Privacy Policy', group: 'Legal' },
];

export const EXTERNAL_LINK_VALUE = '__external__';
