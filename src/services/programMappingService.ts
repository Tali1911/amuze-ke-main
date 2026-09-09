export interface ProgramType {
  value: string;
  label: string;
  url: string;
  category: string;
}

export const programTypes: ProgramType[] = [
  // Holiday Camps
  { 
    value: 'easter-camp', 
    label: 'Easter Camp', 
    url: '/camps/easter', 
    category: 'Holiday Camps' 
  },
  { 
    value: 'summer-camp', 
    label: 'Summer Camp', 
    url: '/camps/summer', 
    category: 'Holiday Camps' 
  },
  { 
    value: 'end-year-camp', 
    label: 'End Year Camp', 
    url: '/camps/end-year', 
    category: 'Holiday Camps' 
  },
  
  // Mid-Term Camps
  { 
    value: 'mid-term-feb', 
    label: 'Mid-Term Camp (Feb/March)', 
    url: '/camps/mid-term', 
    category: 'Mid-Term Camps' 
  },
  { 
    value: 'mid-term-may', 
    label: 'Mid-Term Camp (May/June)', 
    url: '/camps/mid-term', 
    category: 'Mid-Term Camps' 
  },
  { 
    value: 'mid-term-oct', 
    label: 'Mid-Term Camp (October)', 
    url: '/camps/mid-term', 
    category: 'Mid-Term Camps' 
  },
  
  // Day Camps
  { 
    value: 'day-camps', 
    label: 'Nairobi Day Camps', 
    url: '/camps/day-camps', 
    category: 'Day Programs' 
  },
  
  // Experiences
  { 
    value: 'kenyan-experiences', 
    label: 'Kenyan Experiences', 
    url: '/experiences/kenyan-experiences', 
    category: 'Experiences' 
  },
  
  // Group Activities
  { 
    value: 'team-building', 
    label: 'Team Building', 
    url: '/group-activities/team-building', 
    category: 'Group Activities' 
  },
  { 
    value: 'parties', 
    label: 'Parties & Events', 
    url: '/group-activities/parties', 
    category: 'Group Activities' 
  },
];

// Helper function to get URL from program type value
export const getProgramUrl = (programTypeValue: string): string => {
  const program = programTypes.find(p => p.value === programTypeValue);
  return program?.url || '/programs';
};

// Helper function to get program label from value
export const getProgramLabel = (programTypeValue: string): string => {
  const program = programTypes.find(p => p.value === programTypeValue);
  return program?.label || 'Program';
};

// Group programs by category for dropdown
export const getProgramsByCategory = (): { [key: string]: ProgramType[] } => {
  return programTypes.reduce((acc, program) => {
    if (!acc[program.category]) {
      acc[program.category] = [];
    }
    acc[program.category].push(program);
    return acc;
  }, {} as { [key: string]: ProgramType[] });
};
