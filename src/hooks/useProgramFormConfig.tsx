import { useState, useEffect } from "react";
import { cmsService } from "@/services/cmsService";

export interface ProgramFormConfig {
  programInfo: {
    title: string;
    subtitle: string;
    description: string;
    ageRange?: string;
  };
  fields: {
    [key: string]: {
      label: string;
      placeholder?: string;
      helpText?: string;
      required?: boolean;
      description?: string;
      options?: Array<{ value: string; label: string }>;
    };
  };
  buttons: {
    submit: string;
    addItem?: string;
    removeItem?: string;
    back?: string;
    submitAndPay?: string;
  };
  messages: {
    successMessage: string;
    errorMessage: string;
    loadingMessage?: string;
    paymentComingSoon?: string;
  };
  addons?: {
    [key: string]: {
      label: string;
      description?: string;
    };
  };
}

const defaultProgramConfigs: { [key: string]: ProgramFormConfig } = {
  "kenyan-experiences": {
    programInfo: {
      title: "Kenyan Experiences",
      subtitle: "(5-Day Programs)",
      description:
        "Each 5-day camp is designed to progressively build resilience, teamwork, cultural awareness, and outdoor confidence through immersive experiences across Kenya's diverse landscapes.",
    },
    fields: {
      parentLeader: { label: "Parent/Leader Name", placeholder: "Enter your full name", required: true },
      participantName: { label: "Participant Name", placeholder: "Enter full name", required: true },
      ageRange: {
        label: "Age Range",
        placeholder: "Select age range",
        options: [
          { value: "9-12", label: "9-12 years" },
          { value: "13-17", label: "13-17 years" },
        ],
      },
      circuit: {
        label: "Circuit",
        placeholder: "Select a circuit",
        options: [
          { value: "mt-kenya", label: "Mt Kenya" },
          { value: "coast", label: "Coast" },
          { value: "mara", label: "Mara" },
          { value: "chalbi", label: "Chalbi" },
          { value: "western", label: "Western" },
        ],
      },
      preferredDate: {
        label: "Preferred Dates",
        placeholder: "Select start date of 5-day program",
        helpText: "5-day program",
      },
      transport: {
        label: "Transport Required",
        description: "Check if you need transportation to/from the circuit location",
      },
      specialMedicalNeeds: {
        label: "Special/Medical Needs (Optional)",
        placeholder: "Please list any allergies, medical conditions, or special requirements",
      },
      email: { label: "Email Address", placeholder: "your.email@example.com", required: true },
      phone: { label: "Phone Number", placeholder: "+254 XXX XXX XXX", required: true },
    },
    buttons: {
      submit: "Submit Registration",
      addItem: "Add Participant",
      removeItem: "Remove",
      back: "Back to Home",
    },
    messages: {
      successMessage: "Registration submitted successfully! Check your email for confirmation.",
      errorMessage: "Failed to submit registration. Please try again.",
      loadingMessage: "Submitting...",
    },
  },
  homeschooling: {
    programInfo: {
      title: "Homeschooling Outdoor Experiences",
      subtitle: "(All Ages)",
      description:
        "Structured integration of physical education and nature immersion. Sports modules include mini athletics, relay races, and cooperative games to build physical literacy.",
    },
    fields: {
      parentName: { label: "Parent Name", placeholder: "Enter your full name", required: true },
      childName: { label: "Child Name", placeholder: "Enter child's full name", required: true },
      dateOfBirth: { label: "Date of Birth", placeholder: "Select date of birth", required: true },
      package: {
        label: "Package",
        placeholder: "Select a package",
        options: [
          { value: "1-day-discovery", label: "1-Day Discovery" },
          { value: "weekly-pod", label: "Weekly Pod Plan (4-Weeks)" },
          { value: "project-based", label: "Project-Based Module (5 Days)" },
        ],
      },
      focus: { label: "Focus Areas", helpText: "Select at least one" },
      transport: { label: "Transport" },
      meal: { label: "Meal" },
      allergies: { label: "Allergies (Optional)", placeholder: "Please list any allergies or dietary restrictions" },
      email: { label: "Email", placeholder: "your@email.com", required: true },
      phone: { label: "Phone Number", placeholder: "+254 700 000 000", required: true },
    },
    buttons: {
      submit: "Submit Registration",
      addItem: "Add Another Child",
      removeItem: "Remove",
      back: "Back to Home",
    },
    messages: {
      successMessage: "Registration submitted successfully! Check your email for confirmation.",
      errorMessage: "Failed to submit registration. Please try again.",
      loadingMessage: "Submitting...",
    },
  },
  "school-experience": {
    programInfo: {
      title: "School Adventures",
      subtitle: "(Ages 6-17 years)",
      description:
        "We partner with schools across Nairobi and Kenya to deliver curriculum-aligned outdoor education programs, school field trips, forest school experiences, and sleep-away camps that enhance academic learning while nurturing holistic child development and environmental stewardship.",
    },
    fields: {
      schoolName: { label: "School Name", placeholder: "Enter school name", required: true },
      numberOfKids: { label: "Number of Kids", placeholder: "e.g., 25", required: true },
      numberOfAdults: { label: "Number of Adults", placeholder: "e.g., 3", required: true },
      ageRange: {
        label: "Age Range",
        placeholder: "Select age range",
        options: [
          { value: "6-8", label: "6-8 years" },
          { value: "9-11", label: "9-11 years" },
          { value: "12-14", label: "12-14 years" },
          { value: "15-17", label: "15-17 years" },
        ],
      },
      package: {
        label: "Package",
        placeholder: "Select a package",
        options: [
          { value: "day-trip", label: "Day Trip" },
          { value: "sleep-away", label: "Sleep-Away" },
          { value: "after-school-club", label: "After-School Club" },
          { value: "physical-education", label: "Physical Education" },
        ],
      },
      preferredDate: { label: "Preferred Dates", placeholder: "Select date" },
      location: {
        label: "Location",
        placeholder: "Select location",
        options: [
          { value: "karura-gate-f", label: "Karura Gate F" },
          { value: "karura-gate-a", label: "Karura Gate A" },
          { value: "tigoni", label: "Tigoni" },
          { value: "ngong", label: "Ngong" },
        ],
      },
      numberOfStudents: { label: "Number of Students", placeholder: "e.g., 30", required: true },
      numberOfTeachers: { label: "Number of Teachers", placeholder: "e.g., 3", required: true },
      transport: { label: "Transport Required" },
      catering: { label: "Catering Required" },
      specialNeeds: { label: "Special Needs (Optional)", placeholder: "Any special requirements or considerations" },
      email: { label: "Email Address", placeholder: "school@email.com", required: true },
      phone: { label: "Phone Number", placeholder: "+254 XXX XXX XXX", required: true },
    },
    buttons: {
      submit: "Submit Registration",
      addItem: "Add Another Age Range",
      removeItem: "Remove",
      back: "Back to Home",
    },
    messages: {
      successMessage: "Registration submitted successfully! Check your email for confirmation.",
      errorMessage: "Failed to submit registration. Please try again.",
      loadingMessage: "Submitting...",
    },
  },
  "team-building": {
    programInfo: {
      title: "Team Building",
      subtitle: "(All Ages)",
      description:
        "Create safe, fun, memory-filled experiences with measurable outcomes. Each package is 90% fun + 10% reflection, focusing on team communication and problem-solving.",
    },
    fields: {
      occasion: {
        label: "Occasion",
        placeholder: "Select occasion",
        options: [
          { value: "birthday", label: "Birthday" },
          { value: "family", label: "Family" },
          { value: "corporate", label: "Corporate" },
        ],
      },
      adultsNumber: { label: "Adults", placeholder: "Number of adults", required: true },
      childrenNumber: { label: "Children", placeholder: "Number of children", required: true },
      ageRange: {
        label: "Age Range",
        placeholder: "Select age range",
        options: [
          { value: "3-below", label: "3 & Below" },
          { value: "4-6", label: "4-6 years" },
          { value: "7-10", label: "7-10 years" },
          { value: "11-13", label: "11-13 years" },
          { value: "14-17", label: "14-17 years" },
          { value: "18+", label: "18+ years" },
        ],
      },
      package: {
        label: "Package",
        placeholder: "Select a package",
        options: [
          { value: "adventure", label: "Adventure Party" },
          { value: "bushcraft", label: "Bushcraft Bash" },
          { value: "nature-carnival", label: "Nature Carnival" },
          { value: "family-corporate", label: "Family/Corporate Build" },
        ],
      },
      eventDate: { label: "Event Date", placeholder: "Select event date", required: true },
      location: {
        label: "Location",
        placeholder: "Select location",
        options: [
          { value: "karura-gate-f", label: "Karura Gate F" },
          { value: "karura-gate-a", label: "Karura Gate A" },
          { value: "tigoni", label: "Tigoni" },
          { value: "ngong", label: "Ngong" },
        ],
      },
      decor: { label: "Decoration" },
      catering: { label: "Catering" },
      email: { label: "Email", placeholder: "your@email.com", required: true },
      phone: { label: "Phone Number", placeholder: "+254 700 000 000", required: true },
    },
    buttons: {
      submit: "Book Experience",
      back: "Back to Home",
    },
    messages: {
      successMessage: "Registration submitted successfully! Check your email for confirmation.",
      errorMessage: "Failed to submit registration. Please try again.",
      loadingMessage: "Submitting...",
    },
    addons: {
      decor: { label: "Decoration" },
      catering: { label: "Catering" },
    },
  },
  parties: {
    programInfo: {
      title: "Party Booking",
      subtitle: "Celebrations & Events",
      description:
        "Book your unforgettable outdoor party experience. Perfect for birthdays, family gatherings, and special celebrations.",
    },
    fields: {
      occasion: {
        label: "Occasion",
        placeholder: "Select occasion",
        options: [
          { value: "birthday", label: "Birthday Party" },
          { value: "anniversary", label: "Anniversary" },
          { value: "reunion", label: "Family Reunion" },
          { value: "other", label: "Other Celebration" },
        ],
      },
      parentName: { label: "Organizer Name", placeholder: "Enter your full name", required: true },
      childName: { label: "Child Name", placeholder: "Enter child's full name", required: true },
      dateOfBirth: { label: "Date of Birth", placeholder: "Select date of birth", required: true },
      specialNeeds: { label: "Special/Medical Needs (Optional)", placeholder: "Allergies, medical conditions, etc." },
      guestsNumber: { label: "Number of Guests", placeholder: "Total number of guests (10-50)", required: true },
      packageType: {
        label: "Package Type",
        placeholder: "Select package",
        options: [
          { value: "half-day", label: "Half-Day Package" },
          { value: "full-day", label: "Full-Day Package" },
        ],
      },
      eventDate: { label: "Event Date", placeholder: "Select event date", required: true },
      location: {
        label: "Location",
        placeholder: "Select location",
        options: [
          { value: "karura-f", label: "Karura Gate F" },
          { value: "tigoni", label: "Tigoni" },
        ],
      },
      decor: { label: "Enhanced Decoration Package" },
      catering: { label: "Catering Services" },
      photography: { label: "Professional Photography" },
      activities: { label: "Special Activities (Rock Climbing, Kayaking)" },
      email: { label: "Email", placeholder: "your@email.com", required: true },
      phone: { label: "Phone Number", placeholder: "+254 700 000 000", required: true },
    },
    buttons: {
      submit: "Book Party",
      addItem: "Add Child",
      removeItem: "Remove",
      back: "Back to Parties Info",
    },
    messages: {
      successMessage: "Party booking submitted successfully! Check your email for confirmation.",
      errorMessage: "Failed to submit booking. Please try again.",
      loadingMessage: "Submitting...",
    },
    addons: {
      decor: { label: "Enhanced Decoration Package" },
      catering: { label: "Catering Services" },
      photography: { label: "Professional Photography" },
      activities: { label: "Special Activities (Rock Climbing, Kayaking)" },
    },
  },
  "day-camps": {
    programInfo: {
      title: "Day Camps Program",
      subtitle: "(All Ages)",
      description:
        "Flexible day camp experiences designed for children of all ages. Choose your preferred session type and duration.",
    },
    fields: {
      parentName: { label: "Parent/Guardian Name", placeholder: "Enter your full name", required: true },
      childName: { label: "Child's Full Name", placeholder: "Enter child's full name", required: true },
      dateOfBirth: { label: "Date of Birth", placeholder: "Select date", required: true },
      numberOfDays: {
        label: "Number of Days",
        placeholder: "Enter number of days (1-60)",
        helpText: "Enter how many days you want to register for",
      },
      sessionType: {
        label: "Session Type",
        options: [
          { value: "half-day", label: "Half Day (8AM-12PM)" },
          { value: "full-day", label: "Full Day (8AM-5PM)" },
        ],
      },
      specialNeeds: {
        label: "Special Needs/Medical Information",
        placeholder: "Please describe any special needs, allergies, or medical conditions",
      },
      emergencyContact: {
        label: "Emergency Contact Name",
        placeholder: "Enter emergency contact name",
        required: true,
      },
      emergencyPhone: { label: "Emergency Phone", placeholder: "+254 XXX XXX XXX", required: true },
      email: { label: "Email Address", placeholder: "your.email@example.com", required: true },
      phone: { label: "Phone Number", placeholder: "+254 XXX XXX XXX", required: true },
    },
    buttons: {
      submit: "Register Only",
      submitAndPay: "Register & Pay Now",
      addItem: "Add Another Child",
      removeItem: "Remove",
      back: "Back to Home",
    },
    messages: {
      successMessage: "Registration submitted successfully! We'll contact you shortly.",
      errorMessage: "Failed to submit registration. Please try again.",
      loadingMessage: "Submitting...",
      paymentComingSoon: "Payment integration coming soon! Your registration is saved as unpaid.",
    },
  },
};

export const useProgramFormConfig = (formType: string) => {
  const [config, setConfig] = useState<ProgramFormConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        const data = await cmsService.getProgramFormConfig(formType);

        if (data?.metadata?.formConfig) {
          setConfig(data.metadata.formConfig);
        } else {
          // Use default config if no CMS data found
          setConfig(defaultProgramConfigs[formType] || null);
        }
      } catch (err) {
        console.error("Error fetching program form config:", err);
        setError(err instanceof Error ? err.message : "Failed to load configuration");
        // Fall back to default config on error
        setConfig(defaultProgramConfigs[formType] || null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [formType]);

  return { config, isLoading, error };
};
