import { Registration, ChildRegistration } from '@/types/registration';

// Function to generate a unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Function to load data from local storage
export const loadFromLocalStorage = () => {
  // Get all data from local storage
  const programsData = localStorage.getItem('programsData');
  const adminUsersData = localStorage.getItem('adminUsersData');
  const announcementsData = localStorage.getItem('announcementsData');
  const featuresData = localStorage.getItem('featuresData');
  const galleryImagesData = localStorage.getItem('galleryImages');
  const contentData = localStorage.getItem('contentData');
  const teamMembersData = localStorage.getItem('teamMembers');
  
  // Log the data being loaded
  console.log('Loading data from local storage:', {
    programsData,
    adminUsersData,
    announcementsData,
    featuresData,
    galleryImagesData,
    contentData,
    teamMembersData
  });

  return {
    programsData,
    adminUsersData,
    announcementsData,
    featuresData,
    galleryImagesData,
    contentData,
    teamMembersData
  };
};

// Function to simulate saving data to local storage
export const saveToLocalStorage = () => {
  // Get all data from local storage
  const programsData = localStorage.getItem('programsData');
  const adminUsersData = localStorage.getItem('adminUsersData');
  const announcementsData = localStorage.getItem('announcementsData');
  const featuresData = localStorage.getItem('featuresData');
  const galleryImagesData = localStorage.getItem('galleryImages');
  const contentData = localStorage.getItem('contentData');
  const teamMembersData = localStorage.getItem('teamMembers');
  
  // Log the data being saved
  console.log('Saving data to local storage:', {
    programsData,
    adminUsersData,
    announcementsData,
    featuresData,
    galleryImagesData,
    contentData,
    teamMembersData
  });
};

// Function to get programs from local storage
export const getPrograms = () => {
  const programsData = localStorage.getItem('programsData');
  return programsData ? JSON.parse(programsData) : null;
};

// Function to save a program to local storage
export const saveProgram = (program: any, adminUsername: string) => {
  const programs = getPrograms() || [];
  
  if (program.id) {
    // Update existing program
    const updatedPrograms = programs.map((p: any) => {
      if (p.id === program.id) {
        return { ...p, ...program, updatedBy: adminUsername, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    localStorage.setItem('programsData', JSON.stringify(updatedPrograms));
    return { ...program, updatedBy: adminUsername, updatedAt: new Date().toISOString() };
  } else {
    // Create new program
    const newProgram = { ...program, id: generateId(), createdBy: adminUsername, createdAt: new Date().toISOString() };
    programs.push(newProgram);
    localStorage.setItem('programsData', JSON.stringify(programs));
    return newProgram;
  }
};

// Function to delete a program from local storage
export const deleteProgram = (id: string, adminUsername: string) => {
  let programs = getPrograms() || [];
  programs = programs.filter((program: any) => program.id !== id);
  localStorage.setItem('programsData', JSON.stringify(programs));
  return true;
};

// Function to get admin users from local storage
export const getAdminUsers = () => {
  const adminUsersData = localStorage.getItem('adminUsersData');
  return adminUsersData ? JSON.parse(adminUsersData) : [];
};

// Function to get admin user by ID from local storage
export const getAdminUserById = (username: string, password?: string) => {
  const adminUsers = getAdminUsers() || [];
  const adminUser = adminUsers.find((user: any) => user.username === username);
  
  if (password) {
    return adminUsers.find((user: any) => user.username === username && user.password === password);
  }
  
  return adminUser;
};

// Function to save an admin user to local storage
export const saveAdminUser = (adminUser: any, currentAdminUsername: string) => {
  const adminUsers = getAdminUsers() || [];
  
  if (adminUser.id) {
    // Update existing admin user
    const updatedAdminUsers = adminUsers.map((user: any) => {
      if (user.id === adminUser.id) {
        return { ...user, ...adminUser, updatedBy: currentAdminUsername, updatedAt: new Date().toISOString() };
      }
      return user;
    });
    localStorage.setItem('adminUsersData', JSON.stringify(updatedAdminUsers));
    return { ...adminUser, updatedBy: currentAdminUsername, updatedAt: new Date().toISOString() };
  } else {
    // Create new admin user
    const newAdminUser = { ...adminUser, id: generateId(), createdBy: currentAdminUsername, createdAt: new Date().toISOString() };
    adminUsers.push(newAdminUser);
    localStorage.setItem('adminUsersData', JSON.stringify(adminUsers));
    return newAdminUser;
  }
};

// Function to add a new admin user
export const addAdminUser = (username: string, password: string, isSuperAdmin: boolean, currentAdminUsername: string) => {
  const adminUsers = getAdminUsers() || [];
  
  // Check if username already exists
  if (adminUsers.some((user: any) => user.username === username)) {
    throw new Error(`Username ${username} already exists`);
  }
  
  // Create new admin user
  const newAdminUser = { 
    id: generateId(), 
    username, 
    password, 
    isSuperAdmin,
    createdBy: currentAdminUsername,
    createdAt: new Date().toISOString()
  };
  
  adminUsers.push(newAdminUser);
  localStorage.setItem('adminUsersData', JSON.stringify(adminUsers));
  return newAdminUser;
};

// Function to update an admin user
export const updateAdminUser = (id: string, updates: any, currentAdminUsername: string) => {
  const adminUsers = getAdminUsers() || [];
  
  // Find the admin to update
  const adminIndex = adminUsers.findIndex((user: any) => user.id === id);
  if (adminIndex === -1) {
    throw new Error(`Admin user with ID ${id} not found`);
  }
  
  // Prepare updated admin user
  const updatedAdmin = { 
    ...adminUsers[adminIndex],
    ...updates,
    updatedBy: currentAdminUsername,
    updatedAt: new Date().toISOString()
  };
  
  // If no password was provided, keep the existing one
  if (!updates.password) {
    delete updatedAdmin.password;
    updatedAdmin.password = adminUsers[adminIndex].password;
  }
  
  // Update the admin user
  adminUsers[adminIndex] = updatedAdmin;
  localStorage.setItem('adminUsersData', JSON.stringify(adminUsers));
  return updatedAdmin;
};

// Function to delete an admin user from local storage
export const deleteAdminUser = (id: string, currentAdminUsername: string) => {
  let adminUsers = getAdminUsers() || [];
  adminUsers = adminUsers.filter((adminUser: any) => adminUser.id !== id);
  localStorage.setItem('adminUsersData', JSON.stringify(adminUsers));
  return true;
};

// Function to get announcements from local storage
export const getAnnouncements = () => {
  const announcementsData = localStorage.getItem('announcementsData');
  return announcementsData ? JSON.parse(announcementsData) : null;
};

// Function to save an announcement to local storage
export const saveAnnouncement = (announcement: any, currentAdminUsername: string) => {
  const announcements = getAnnouncements() || [];
  
  if (announcement.id) {
    // Update existing announcement
    const updatedAnnouncements = announcements.map((a: any) => {
      if (a.id === announcement.id) {
        return { ...a, ...announcement, updatedBy: currentAdminUsername, updatedAt: new Date().toISOString() };
      }
      return a;
    });
    localStorage.setItem('announcementsData', JSON.stringify(updatedAnnouncements));
    return { ...announcement, updatedBy: currentAdminUsername, updatedAt: new Date().toISOString() };
  } else {
    // Create new announcement
    const newAnnouncement = { ...announcement, id: generateId(), createdBy: currentAdminUsername, createdAt: new Date().toISOString() };
    announcements.push(newAnnouncement);
    localStorage.setItem('announcementsData', JSON.stringify(announcements));
    return newAnnouncement;
  }
};

// Function to delete an announcement from local storage
export const deleteAnnouncement = (id: string, currentAdminUsername: string) => {
  let announcements = getAnnouncements() || [];
  announcements = announcements.filter((announcement: any) => announcement.id !== id);
  localStorage.setItem('announcementsData', JSON.stringify(announcements));
  return true;
};

// Function to get features from local storage
export const getFeatures = () => {
  const featuresData = localStorage.getItem('featuresData');
  return featuresData ? JSON.parse(featuresData) : [
    { id: 'feature1', title: 'Interactive Learning', description: 'Engage in fun, hands-on activities.', isEnabled: true },
    { id: 'feature2', title: 'Outdoor Adventures', description: 'Explore nature with guided excursions.', isEnabled: true },
    { id: 'feature3', title: 'Creative Arts', description: 'Express yourself through art and music.', isEnabled: true },
    { id: 'feature4', title: 'Team Building', description: 'Develop cooperation and leadership skills.', isEnabled: true }
  ];
};

// Function to save features to local storage
export const saveFeatures = (features: any) => {
  localStorage.setItem('featuresData', JSON.stringify(features));
};

// Function to get gallery images from local storage
export const getGalleryImages = () => {
  const galleryImagesData = localStorage.getItem('galleryImages');
  return galleryImagesData ? JSON.parse(galleryImagesData) : [];
};

// Function to save gallery images to local storage
export const saveGalleryImages = (images: any, currentAdminUsername: string) => {
  localStorage.setItem('galleryImages', JSON.stringify(images));
};

// Function to get content from local storage
export const getContent = () => {
  const contentData = localStorage.getItem('contentData');
  return contentData ? JSON.parse(contentData) : {
    heroTitle: 'Unleash Your Child\'s Potential',
    heroDescription: 'Discover a world of fun and learning at Amuse.Ke. Our programs are designed to inspire creativity and curiosity in children of all ages.',
    aboutTitle: 'About Amuse.Ke',
    aboutDescription: 'Amuse.Ke is dedicated to providing high-quality, engaging programs for children. Our experienced team is passionate about creating a safe and supportive environment where children can learn, grow, and thrive.'
  };
};

// Function to save content to local storage
export const saveContent = (content: any, currentAdminUsername: string) => {
  localStorage.setItem('contentData', JSON.stringify(content));
};

// Function to get team members from local storage
export const getTeamMembers = () => {
  const teamMembersData = localStorage.getItem('teamMembers');
  return teamMembersData ? JSON.parse(teamMembersData) : [];
};

// Function to save team members to local storage
export const saveTeamMembers = (teamMembers: any, currentAdminUsername: string) => {
  localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
};

// Function to delete a team member from local storage
export const deleteTeamMember = (id: string, currentAdminUsername: string) => {
  let teamMembers = getTeamMembers() || [];
  teamMembers = teamMembers.filter((teamMember: any) => teamMember.id !== id);
  localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
  return true;
};

// Function to get registrations from local storage
export const getRegistrations = (): Registration[] | null => {
  const registrationsData = localStorage.getItem('registrationsData');
  return registrationsData ? JSON.parse(registrationsData) : null;
};

// Make sure to export the Registration interface for use in other files
export type { Registration, ChildRegistration };

// Update the addRegistration function to use our interface
export const addRegistration = (registration: Omit<Registration, 'id' | 'createdAt'>): void => {
  try {
    const registrationsData = localStorage.getItem('registrationsData');
    let registrations: Registration[] = [];
    
    if (registrationsData) {
      registrations = JSON.parse(registrationsData);
    }
    
    const newRegistration: Registration = {
      ...registration,
      id: Date.now().toString(),
      createdAt: new Date(),
      paymentStatus: registration.paymentStatus || 'pending'
    };
    
    registrations.push(newRegistration);
    localStorage.setItem('registrationsData', JSON.stringify(registrations));
    
    console.log('Registration added:', newRegistration);
  } catch (error) {
    console.error('Error adding registration:', error);
    throw new Error('Failed to add registration. Please try again.');
  }
};
