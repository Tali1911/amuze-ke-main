
import { Event } from '@/services/calendarService';

// Default programs for testing and development
export const createDefaultPrograms = (): Event[] => {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(today.getDate() + 14);
  
  const threeWeeksLater = new Date(today);
  threeWeeksLater.setDate(today.getDate() + 21);
  
  const oneMonthLater = new Date(today);
  oneMonthLater.setDate(today.getDate() + 30);

  return [
    {
      id: 'camp-001',
      title: 'Holiday Adventure Camp',
      start: nextWeek,
      end: new Date(nextWeek.getTime() + 6 * 60 * 60 * 1000), // 6 hours later (9AM-3PM)
      description: 'Spark your child\'s love for adventure! Our exciting camps offer games, orientation, survival skills and exploration in nature. Unforgettable memories await!',
      color: '#22c55e',
      location: 'Karura Forest, Sigiria Ridge (Gate F)',
      maxAttendees: 60,
      programId: 'camp-001',
      isWeeklong: false,
      eventType: 'camp',
      ageGroups: [
        { name: 'Little Explorers', ageRange: '3-5 years', capacity: 15, description: 'Gentle forest activities for young children' },
        { name: 'Forest Rangers', ageRange: '6-9 years', capacity: 20, description: 'Adventure and exploration activities' },
        { name: 'Wilderness Scouts', ageRange: '10-13 years', capacity: 15, description: 'Advanced outdoor skills and leadership' },
        { name: 'Adventure Leaders', ageRange: '14-17 years', capacity: 10, description: 'Leadership development and wilderness skills' }
      ],
      pricing: {
        morning: 1500, // 9AM-1PM or 11AM-3PM
        afternoon: 1500,
        fullDay: 2500 // 9AM-3PM
      },
      enableDefaultActivities: true,
      defaultActivities: [
        { id: '1', name: 'Obstacle Course', price: 0, description: 'Challenge yourself on our forest obstacle course' },
        { id: '2', name: 'Ropes Course', price: 600, description: 'Adventure ropes course experience' },
        { id: '3', name: 'Archery', price: 500, description: 'Professional archery sessions (ages 8+)' },
        { id: '4', name: 'Horse Riding', price: 2000, description: 'Guided horseback riding in the forest' },
        { id: '5', name: 'Mountain Biking', price: 0, description: 'Bring your bike for trail adventures' }
      ]
    },
    {
      id: 'camp-002',
      title: 'Summer Adventure Camp',
      start: twoWeeksLater,
      end: new Date(twoWeeksLater.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days later
      description: 'A comprehensive summer camp featuring all our forest activities including survival skills, team building, and outdoor exploration.',
      color: '#3b82f6',
      location: 'Karura Forest, Sigiria Ridge (Gate F)',
      maxAttendees: 80,
      programId: 'camp-002',
      isWeeklong: true,
      eventType: 'camp',
      ageGroups: [
        { name: 'Young Adventurers', ageRange: '4-7 years', capacity: 20, description: 'Age-appropriate forest fun and games' },
        { name: 'Nature Explorers', ageRange: '8-11 years', capacity: 25, description: 'Intermediate outdoor activities and skills' },
        { name: 'Wilderness Champions', ageRange: '12-15 years', capacity: 20, description: 'Advanced wilderness and leadership training' },
        { name: 'Adventure Mentors', ageRange: '16-17 years', capacity: 15, description: 'Leadership roles and advanced outdoor skills' }
      ],
      pricing: {
        morning: 1500,
        afternoon: 1500,
        fullDay: 2500,
        weeklong: 12000
      },
      enableDefaultActivities: true,
      defaultActivities: [
        { id: '1', name: 'All Forest Activities', price: 0, description: 'Access to obstacle course, outdoor exploration, games' },
        { id: '2', name: 'Arts and Crafts', price: 300, description: 'Creative activities using natural materials' },
        { id: '3', name: 'Mindfulness Sessions', price: 0, description: 'Connecting with nature through mindfulness' },
        { id: '4', name: 'Team Building', price: 0, description: 'Collaborative challenges and group activities' }
      ]
    },
    {
      id: 'birthday-001',
      title: 'Forest Birthday Party',
      start: threeWeeksLater,
      end: new Date(threeWeeksLater.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
      description: 'Make birthdays magical! Our exciting service brings fun to your celebration with engaging activities, unforgettable themes, and memories that last.',
      color: '#f59e0b',
      location: 'Karura Forest, Sigiria Ridge (Gate F)',
      maxAttendees: 30,
      programId: 'birthday-001',
      isWeeklong: false,
      eventType: 'other',
      pricing: {
        morning: 0, // Custom pricing based on activities
        afternoon: 0,
        fullDay: 0 // Pricing depends on number of kids, activities, and duration
      },
      enableDefaultActivities: true,
      defaultActivities: [
        { id: '1', name: 'Obstacle Course', price: 0, description: 'Birthday adventure on our obstacle course' },
        { id: '2', name: 'Treasure Hunt', price: 500, description: 'Exciting treasure and scavenger hunts' },
        { id: '3', name: 'Trampolines', price: 300, description: 'Fun bouncing activities' },
        { id: '4', name: 'Water Games', price: 400, description: 'Water balloon fun and water games' },
        { id: '5', name: 'Nature Crafts', price: 500, description: 'Bracelet making and outdoor painting' }
      ]
    },
    {
      id: 'school-001',
      title: 'School Field Trip Program',
      start: oneMonthLater,
      end: new Date(oneMonthLater.getTime() + 6 * 60 * 60 * 1000), // 6 hours later
      description: 'Unleash the classroom outdoors! Partner with us for collaborative nature programs. We offer engaging activities, skill-building adventures, and environmental education.',
      color: '#10b981',
      location: 'Karura Forest, Sigiria Ridge (Gate F)',
      maxAttendees: 100,
      programId: 'school-001',
      isWeeklong: false,
      eventType: 'program',
      ageGroups: [
        { name: 'Early Years', ageRange: 'Kindergarten-Grade 2', capacity: 30, description: 'Age-appropriate nature exploration' },
        { name: 'Elementary', ageRange: 'Grade 3-6', capacity: 35, description: 'Educational adventures and team building' },
        { name: 'Middle School', ageRange: 'Grade 7-9', capacity: 25, description: 'Advanced outdoor education and leadership' },
        { name: 'High School', ageRange: 'Grade 10-12', capacity: 20, description: 'Leadership development and environmental stewardship' }
      ],
      pricing: {
        morning: 1200, // Custom pricing for schools
        afternoon: 1200,
        fullDay: 2000
      },
      enableDefaultActivities: true,
      defaultActivities: [
        { id: '1', name: 'Environmental Education', price: 0, description: 'Hands-on learning about ecosystems and conservation' },
        { id: '2', name: 'Team Building', price: 0, description: 'Collaborative challenges that build teamwork' },
        { id: '3', name: 'Nature Walks', price: 0, description: 'Guided exploration of forest biodiversity' },
        { id: '4', name: 'Orienteering', price: 300, description: 'Navigation skills and outdoor competency' }
      ]
    }
  ];
};

// Initialize default programs in localStorage if none exist
export const initializeDefaultPrograms = (): void => {
  const existingEvents = localStorage.getItem('calendar_events');
  
  if (!existingEvents || JSON.parse(existingEvents).length === 0) {
    const defaultPrograms = createDefaultPrograms();
    const eventsToSave = defaultPrograms.map(event => ({
      ...event,
      start: event.start instanceof Date ? event.start.toISOString() : event.start,
      end: event.end instanceof Date ? event.end.toISOString() : event.end,
    }));
    
    localStorage.setItem('calendar_events', JSON.stringify(eventsToSave));
    console.log('Default programs initialized in localStorage:', defaultPrograms.length);
  } else {
    console.log('Existing programs found in localStorage, skipping initialization');
  }
};

// Clear and reinitialize programs (useful for testing)
export const resetDefaultPrograms = (): void => {
  localStorage.removeItem('calendar_events');
  initializeDefaultPrograms();
  console.log('Programs reset and reinitialized');
};
