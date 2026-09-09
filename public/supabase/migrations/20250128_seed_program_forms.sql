-- Seed program form configurations in content_items table
-- This makes all program forms manageable through the Marketing Portal

-- Kenyan Experiences Form
INSERT INTO content_items (slug, title, content_type, content, status, metadata)
VALUES (
  'kenyan-experiences-form',
  'Kenyan Experiences Form Configuration',
  'program_form',
  'Form configuration for Kenyan Experiences program',
  'published',
  '{
    "formConfig": {
      "programInfo": {
        "title": "Kenyan Experiences",
        "subtitle": "(5-Day Programs)",
        "description": "Each 5-day camp is designed to progressively build resilience, teamwork, cultural awareness, and outdoor confidence through immersive experiences across Kenya''s diverse landscapes."
      },
      "fields": {
        "parentLeader": {"label": "Parent/Leader Name", "placeholder": "Enter your full name", "required": true},
        "participantName": {"label": "Participant Name", "placeholder": "Enter full name", "required": true},
        "ageRange": {"label": "Age Range", "placeholder": "Select age range"},
        "circuit": {"label": "Circuit", "placeholder": "Select a circuit"},
        "preferredDate": {"label": "Preferred Dates", "placeholder": "Select start date of 5-day program", "helpText": "5-day program"},
        "transport": {"label": "Transport Required", "description": "Check if you need transportation to/from the circuit location"},
        "specialMedicalNeeds": {"label": "Special/Medical Needs (Optional)", "placeholder": "Please list any allergies, medical conditions, or special requirements"},
        "email": {"label": "Email Address", "placeholder": "your.email@example.com", "required": true},
        "phone": {"label": "Phone Number", "placeholder": "+254 XXX XXX XXX", "required": true}
      },
      "buttons": {
        "submit": "Submit Registration",
        "addItem": "Add Participant",
        "removeItem": "Remove",
        "back": "Back to Home"
      },
      "messages": {
        "successMessage": "Registration submitted successfully! Check your email for confirmation.",
        "errorMessage": "Failed to submit registration. Please try again.",
        "loadingMessage": "Submitting..."
      }
    }
  }'::jsonb
)
ON CONFLICT (slug, content_type) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Homeschooling Form
INSERT INTO content_items (slug, title, content_type, content, status, metadata)
VALUES (
  'homeschooling-form',
  'Homeschooling Form Configuration',
  'program_form',
  'Form configuration for Homeschooling program',
  'published',
  '{
    "formConfig": {
      "programInfo": {
        "title": "Homeschooling Outdoor Experiences",
        "subtitle": "(All Ages)",
        "description": "Structured integration of physical education and nature immersion. Sports modules include mini athletics, relay races, and cooperative games to build physical literacy."
      },
      "fields": {
        "parentName": {"label": "Parent Name", "placeholder": "Enter your full name", "required": true},
        "childName": {"label": "Child Name", "placeholder": "Enter child''s full name", "required": true},
        "dateOfBirth": {"label": "Date of Birth", "placeholder": "Select date of birth", "required": true},
        "package": {"label": "Package", "placeholder": "Select a package"},
        "focus": {"label": "Focus Areas", "helpText": "Select at least one"},
        "transport": {"label": "Transport"},
        "meal": {"label": "Meal"},
        "allergies": {"label": "Allergies (Optional)", "placeholder": "Please list any allergies or dietary restrictions"},
        "email": {"label": "Email", "placeholder": "your@email.com", "required": true},
        "phone": {"label": "Phone Number", "placeholder": "+254 700 000 000", "required": true}
      },
      "buttons": {
        "submit": "Submit Registration",
        "addItem": "Add Another Child",
        "removeItem": "Remove",
        "back": "Back to Home"
      },
      "messages": {
        "successMessage": "Registration submitted successfully! Check your email for confirmation.",
        "errorMessage": "Failed to submit registration. Please try again.",
        "loadingMessage": "Submitting..."
      }
    }
  }'::jsonb
)
ON CONFLICT (slug, content_type) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- School Experience Form
INSERT INTO content_items (slug, title, content_type, content, status, metadata)
VALUES (
  'school-experience-form',
  'School Experience Form Configuration',
  'program_form',
  'Form configuration for School Experience program',
  'published',
  '{
    "formConfig": {
      "programInfo": {
        "title": "School Adventures",
        "subtitle": "(Ages 6-17 years)",
        "description": "Designed to complement curriculum with immersive experiential learning. International schools receive curriculum tie-in and reflection journals. Kenyan schools gain accessible packages focusing on practical life skills."
      },
      "fields": {
        "schoolName": {"label": "School Name", "placeholder": "Enter school name", "required": true},
        "numberOfKids": {"label": "Number of Kids", "placeholder": "e.g., 25", "required": true},
        "numberOfAdults": {"label": "Number of Adults", "placeholder": "e.g., 3", "required": true},
        "ageRange": {"label": "Age Range", "placeholder": "Select age range"},
        "package": {"label": "Package", "placeholder": "Select a package"},
        "preferredDate": {"label": "Preferred Dates", "placeholder": "Select date"},
        "location": {"label": "Location", "placeholder": "Select location"},
        "numberOfStudents": {"label": "Number of Students", "placeholder": "e.g., 30", "required": true},
        "numberOfTeachers": {"label": "Number of Teachers", "placeholder": "e.g., 3", "required": true},
        "transport": {"label": "Transport Required"},
        "catering": {"label": "Catering Required"},
        "specialNeeds": {"label": "Special Needs (Optional)", "placeholder": "Any special requirements or considerations"},
        "email": {"label": "Email Address", "placeholder": "school@email.com", "required": true},
        "phone": {"label": "Phone Number", "placeholder": "+254 XXX XXX XXX", "required": true}
      },
      "buttons": {
        "submit": "Submit Registration",
        "addItem": "Add Another Age Range",
        "removeItem": "Remove",
        "back": "Back to Home"
      },
      "messages": {
        "successMessage": "Registration submitted successfully! Check your email for confirmation.",
        "errorMessage": "Failed to submit registration. Please try again.",
        "loadingMessage": "Submitting..."
      }
    }
  }'::jsonb
)
ON CONFLICT (slug, content_type) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Team Building Form
INSERT INTO content_items (slug, title, content_type, content, status, metadata)
VALUES (
  'team-building-form',
  'Team Building Form Configuration',
  'program_form',
  'Form configuration for Team Building program',
  'published',
  '{
    "formConfig": {
      "programInfo": {
        "title": "Team Building",
        "subtitle": "(All Ages)",
        "description": "Create safe, fun, memory-filled experiences with measurable outcomes. Each package is 90% fun + 10% reflection, focusing on team communication and problem-solving."
      },
      "fields": {
        "occasion": {"label": "Occasion", "placeholder": "Select occasion"},
        "adultsNumber": {"label": "Adults", "placeholder": "Number of adults", "required": true},
        "childrenNumber": {"label": "Children", "placeholder": "Number of children", "required": true},
        "ageRange": {"label": "Age Range", "placeholder": "Select age range"},
        "package": {"label": "Package", "placeholder": "Select a package"},
        "eventDate": {"label": "Event Date", "placeholder": "Select event date", "required": true},
        "location": {"label": "Location", "placeholder": "Select location"},
        "decor": {"label": "Decoration"},
        "catering": {"label": "Catering"},
        "email": {"label": "Email", "placeholder": "your@email.com", "required": true},
        "phone": {"label": "Phone Number", "placeholder": "+254 700 000 000", "required": true}
      },
      "buttons": {
        "submit": "Book Experience",
        "back": "Back to Home"
      },
      "messages": {
        "successMessage": "Registration submitted successfully! Check your email for confirmation.",
        "errorMessage": "Failed to submit registration. Please try again.",
        "loadingMessage": "Submitting..."
      }
    }
  }'::jsonb
)
ON CONFLICT (slug, content_type) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Parties Form
INSERT INTO content_items (slug, title, content_type, content, status, metadata)
VALUES (
  'parties-form',
  'Parties Form Configuration',
  'program_form',
  'Form configuration for Parties program',
  'published',
  '{
    "formConfig": {
      "programInfo": {
        "title": "Party Booking",
        "subtitle": "Celebrations & Events",
        "description": "Book your unforgettable outdoor party experience. Perfect for birthdays, family gatherings, and special celebrations."
      },
      "fields": {
        "occasion": {"label": "Occasion", "placeholder": "Select occasion"},
        "parentName": {"label": "Organizer Name", "placeholder": "Enter your full name", "required": true},
        "childName": {"label": "Child Name", "placeholder": "Enter child''s full name", "required": true},
        "dateOfBirth": {"label": "Date of Birth", "placeholder": "Select date of birth", "required": true},
        "specialNeeds": {"label": "Special/Medical Needs (Optional)", "placeholder": "Allergies, medical conditions, etc."},
        "guestsNumber": {"label": "Number of Guests", "placeholder": "Total number of guests (10-50)", "required": true},
        "packageType": {"label": "Package Type", "placeholder": "Select package"},
        "eventDate": {"label": "Event Date", "placeholder": "Select event date", "required": true},
        "location": {"label": "Location", "placeholder": "Select location"},
        "decor": {"label": "Enhanced Decoration Package"},
        "catering": {"label": "Catering Services"},
        "photography": {"label": "Professional Photography"},
        "activities": {"label": "Special Activities (Rock Climbing, Kayaking)"},
        "email": {"label": "Email", "placeholder": "your@email.com", "required": true},
        "phone": {"label": "Phone Number", "placeholder": "+254 700 000 000", "required": true}
      },
      "buttons": {
        "submit": "Book Party",
        "addItem": "Add Child",
        "removeItem": "Remove",
        "back": "Back to Parties Info"
      },
      "messages": {
        "successMessage": "Party booking submitted successfully! Check your email for confirmation.",
        "errorMessage": "Failed to submit booking. Please try again.",
        "loadingMessage": "Submitting..."
      }
    }
  }'::jsonb
)
ON CONFLICT (slug, content_type) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Day Camps Form
INSERT INTO content_items (slug, title, content_type, content, status, metadata)
VALUES (
  'day-camps-form',
  'Day Camps Form Configuration',
  'program_form',
  'Form configuration for Day Camps program',
  'published',
  '{
    "formConfig": {
      "programInfo": {
        "title": "Day Camps Program",
        "subtitle": "(All Ages)",
        "description": "Flexible day camp experiences designed for children of all ages. Choose your preferred session type and duration."
      },
      "fields": {
        "parentName": {"label": "Parent/Guardian Name", "placeholder": "Enter your full name", "required": true},
        "childName": {"label": "Child''s Full Name", "placeholder": "Enter child''s full name", "required": true},
        "dateOfBirth": {"label": "Date of Birth", "placeholder": "Select date", "required": true},
        "numberOfDays": {"label": "Number of Days", "placeholder": "Enter number of days (1-60)", "helpText": "Enter how many days you want to register for"},
        "sessionType": {"label": "Session Type"},
        "specialNeeds": {"label": "Special Needs/Medical Information", "placeholder": "Please describe any special needs, allergies, or medical conditions"},
        "emergencyContact": {"label": "Emergency Contact Name", "placeholder": "Enter emergency contact name", "required": true},
        "emergencyPhone": {"label": "Emergency Phone", "placeholder": "+254 XXX XXX XXX", "required": true},
        "email": {"label": "Email Address", "placeholder": "your.email@example.com", "required": true},
        "phone": {"label": "Phone Number", "placeholder": "+254 XXX XXX XXX", "required": true}
      },
      "buttons": {
        "submit": "Register Only",
        "submitAndPay": "Register & Pay Now",
        "addItem": "Add Another Child",
        "removeItem": "Remove",
        "back": "Back to Home"
      },
      "messages": {
        "successMessage": "Registration submitted successfully! We''ll contact you shortly.",
        "errorMessage": "Failed to submit registration. Please try again.",
        "loadingMessage": "Submitting...",
        "paymentComingSoon": "Payment integration coming soon! Your registration is saved as unpaid."
      }
    }
  }'::jsonb
)
ON CONFLICT (slug, content_type) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  updated_at = NOW();
