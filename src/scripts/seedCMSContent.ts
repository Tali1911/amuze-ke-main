import { cmsService } from "@/services/cmsService";
import adventureImage from "@/assets/adventure.jpg";
import schoolsImage from "@/assets/schools.jpg";
import campingImage from "@/assets/camping.jpg";
import birthdayImage from "@/assets/birthday.jpg";
import homeschoolingImage from "@/assets/schools.jpg";
import dailyActivitiesImage from "@/assets/daily-activities.jpg";

const seedAboutSections = async () => {
  const aboutSections = [
    {
      title: "Introduction",
      slug: "about-intro",
      content:
        "At Amuse, we believe that the best way for children to learn is by exploring, experiencing, and engaging with the world around them. We specialize in creating outdoor programs that inspire curiosity, foster independence, and build lasting skills—all while having fun in nature.",
      content_type: "about_section" as const,
      status: "published" as const,
      metadata: { section_type: "intro", icon: "FileText", order: 0 },
    },
    {
      title: "Our Purpose",
      slug: "about-purpose",
      content:
        "Our purpose is to enrich the lives of children in Kenya by making outdoor learning meaningful, accessible, and unforgettable. We create opportunities for kids to disconnect from screens, reconnect with nature, and discover the joy of hands-on learning.",
      content_type: "about_section" as const,
      status: "published" as const,
      metadata: { section_type: "purpose", icon: "Target", order: 1 },
    },
    {
      title: "Our Mission",
      slug: "about-mission",
      content:
        "To design and deliver high-quality outdoor education programs that complement formal learning, strengthen physical and mental well-being, and cultivate lifelong skills.",
      content_type: "about_section" as const,
      status: "published" as const,
      metadata: { section_type: "mission", icon: "Eye", order: 2 },
    },
    {
      title: "Our Vision",
      slug: "about-vision",
      content:
        "A Kenya where every child has the opportunity to learn, grow, and thrive through the power of outdoor experiences.",
      content_type: "about_section" as const,
      status: "published" as const,
      metadata: { section_type: "vision", icon: "Heart", order: 3 },
    },
    {
      title: "Our Values",
      slug: "about-values",
      content:
        "Safety First: We prioritize the well-being of every child in our care.\nInclusion: Our programs are designed to welcome children of all abilities and backgrounds.\nExcellence: We deliver well-organized, thoughtfully planned experiences.\nConnection: We help children connect with nature, each other, and themselves.",
      content_type: "about_section" as const,
      status: "published" as const,
      metadata: { section_type: "values", icon: "CheckCircle", order: 4 },
    },
  ];

  console.log("Seeding about sections...");
  for (const section of aboutSections) {
    await cmsService.createContent(section);
  }
  console.log("✓ About sections seeded");
};

const seedServiceItems = async () => {
  const serviceItems = [
    {
      title: "Homeschooling Outdoor Experiences",
      slug: "service-homeschooling",
      content: "Structured programs integrating physical education and nature immersion.",
      content_type: "service_item" as const,
      status: "published" as const,
      metadata: { icon: "GraduationCap", order: 1 },
    },
    {
      title: "Little Forest Explorers",
      slug: "service-little-forest",
      content: "Nurturing sensory exploration and early development for children aged three and below.",
      content_type: "service_item" as const,
      status: "published" as const,
      metadata: { icon: "Baby", order: 2 },
    },
    {
      title: "School Adventures",
      slug: "service-school-experience",
      content: "Tailored trips and clubs to complement school curriculum.",
      content_type: "service_item" as const,
      status: "published" as const,
      metadata: { icon: "School", order: 3 },
    },
    {
      title: "Day and Overnight Camps",
      slug: "service-camps",
      content: "Progressive experiences that build resilience and confidence.",
      content_type: "service_item" as const,
      status: "published" as const,
      metadata: { icon: "Tent", order: 4 },
    },
    {
      title: "Group Activities",
      slug: "service-group-activities",
      content: "Customized parties and team-building events with a focus on fun and tangible outcomes.",
      content_type: "service_item" as const,
      status: "published" as const,
      metadata: { icon: "Users", order: 5 },
    },
    {
      title: "Kenyan Experiences",
      slug: "service-kenyan-experiences",
      content: "Multi-day adventures across various regions of Kenya to build teamwork and cultural awareness.",
      content_type: "service_item" as const,
      status: "published" as const,
      metadata: { icon: "MapPin", order: 6 },
    },
  ];

  console.log("Seeding service items...");
  for (const item of serviceItems) {
    await cmsService.createContent(item);
  }
  console.log("✓ Service items seeded");
};

export const seedHeroSlides = async () => {
  const heroSlides = [
    {
      title: "Mountain Biking",
      slug: "hero-mountain-biking",
      content: "Exhilarating",
      content_type: "hero_slide" as const,
      status: "published" as const,
      metadata: {
        subtitle: "Experience the thrill of mountain biking through scenic trails",
        badge: "Outdoor Adventure",
        buttonText: "Book Now",
        imageUrl: adventureImage,
        order: 1,
      },
    },
    {
      title: "Orienteering",
      slug: "hero-orienteering",
      content: "Challenging",
      content_type: "hero_slide" as const,
      status: "published" as const,
      metadata: {
        subtitle: "Master the art of navigation while exploring the great outdoors",
        badge: "Navigation Skills",
        buttonText: "Learn More",
        imageUrl: schoolsImage,
        order: 2,
      },
    },
    {
      title: "Obstacle Course",
      slug: "hero-obstacle-course",
      content: "Thrilling",
      content_type: "hero_slide" as const,
      status: "published" as const,
      metadata: {
        subtitle: "Test your strength, agility, and determination on our exciting obstacle courses",
        badge: "Physical Adventure",
        buttonText: "Take the Challenge",
        imageUrl: campingImage,
        order: 3,
      },
    },
    {
      title: "Little Explorer",
      slug: "hero-little-explorer",
      content: "Nurturing",
      content_type: "hero_slide" as const,
      status: "published" as const,
      metadata: {
        subtitle: "Nurturing sensory exploration and early development for children aged three and below",
        badge: "Ages 0-3",
        buttonText: "Explore Program",
        imageUrl: birthdayImage,
        link: "/programs/little-forest",
        order: 4,
      },
    },
  ];

  console.log("Seeding hero slides...");
  for (const slide of heroSlides) {
    await cmsService.createContent(slide);
  }
  console.log("✓ Hero slides seeded");
};

export const seedPrograms = async () => {
  const programs = [
    {
      title: "Homeschooling Outdoor Experiences",
      slug: "homeschooling",
      content: "Structured integration of physical education and nature immersion with sports modules.",
      content_type: "program" as const,
      status: "published" as const,
      metadata: {
        icon: "GraduationCap",
        ageRange: "4-17 years",
        duration: "1 day - 4 weeks",
        highlights: ["STEM Integration", "Physical Education", "Nature Immersion", "Sports Modules"],
        imageUrl: homeschoolingImage,
        order: 1,
      },
    },
    {
      title: "Little Forest Explorers",
      slug: "little-forest",
      content: "Nurture sensory exploration, early language acquisition (Swahili focus), and motor development.",
      content_type: "program" as const,
      status: "published" as const,
      metadata: {
        icon: "Baby",
        ageRange: "3 & below",
        duration: "Mon/Fri options",
        highlights: ["Sensory Play", "Language Development", "Motor Skills", "Swahili Focus"],
        imageUrl: dailyActivitiesImage,
        order: 2,
      },
    },
    {
      title: "School Adventures",
      slug: "school-experience",
      content: "Complement curriculum with immersive experiential learning for schools.",
      content_type: "program" as const,
      status: "published" as const,
      metadata: {
        icon: "GraduationCap",
        ageRange: "6-17 years",
        duration: "1-5 days",
        highlights: ["Curriculum Tie-in", "Group Learning", "Adventure Sleep-Aways", "Life Skills"],
        imageUrl: homeschoolingImage,
        order: 3,
      },
    },
    {
      title: "Team Building",
      slug: "team-building",
      content: "Create safe, fun, memory-filled experiences with measurable outcomes.",
      content_type: "program" as const,
      status: "published" as const,
      metadata: {
        icon: "PartyPopper",
        ageRange: "All ages",
        duration: "Half/Full day",
        highlights: ["Team Communication", "Problem-Solving", "90% Fun + 10% Reflection", "Custom Events"],
        imageUrl: birthdayImage,
        order: 4,
      },
    },
    {
      title: "Kenyan Experiences (5-Day)",
      slug: "kenyan-experiences",
      content: "Progressive camps building resilience, teamwork, cultural awareness, and outdoor confidence.",
      content_type: "program" as const,
      status: "published" as const,
      metadata: {
        icon: "Mountain",
        ageRange: "9-17 years",
        duration: "5 days",
        highlights: ["Mt Kenya", "Coast", "Mara", "Cultural Immersion"],
        imageUrl: adventureImage,
        order: 5,
      },
    },
    {
      title: "Day Camps (Nairobi Circuit)",
      slug: "day-camps",
      content: "Structured daily experiences to build confidence, friendships, and life skills.",
      content_type: "program" as const,
      status: "published" as const,
      metadata: {
        icon: "Users",
        ageRange: "3-17 years",
        duration: "Daily programs",
        highlights: ["Karura Gate F", "Age-Appropriate", "Life Skills", "Nature Connection"],
        imageUrl: dailyActivitiesImage,
        order: 6,
      },
    },
  ];

  console.log("Seeding programs...");
  for (const program of programs) {
    await cmsService.createContent(program);
  }
  console.log("✓ Programs seeded");
};

export const seedTestimonials = async () => {
  const testimonials = [
    {
      title: "Amazing Experience",
      slug: "testimonial-1",
      content:
        "The outdoor programs have been transformative for our children. They've developed confidence, teamwork skills, and a deep love for nature.",
      content_type: "testimonial" as const,
      status: "published" as const,
      metadata: {
        author: "Sarah M.",
        role: "Parent of 3",
        avatar: "",
        order: 1,
      },
    },
    {
      title: "Highly Recommended",
      slug: "testimonial-2",
      content:
        "Our school has been partnering with Amuse.Ke for field trips for two years now. The educational value and student engagement are exceptional.",
      content_type: "testimonial" as const,
      status: "published" as const,
      metadata: {
        author: "John K.",
        role: "School Principal",
        avatar: "",
        order: 2,
      },
    },
    {
      title: "Life-Changing Camp",
      slug: "testimonial-3",
      content:
        "My son attended the 5-day Kenyan Experience and came back a different person - more independent, responsible, and excited about the outdoors.",
      content_type: "testimonial" as const,
      status: "published" as const,
      metadata: {
        author: "Grace W.",
        role: "Parent",
        avatar: "",
        order: 3,
      },
    },
  ];

  console.log("Seeding testimonials...");
  for (const testimonial of testimonials) {
    await cmsService.createContent(testimonial);
  }
  console.log("✓ Testimonials seeded");
};

export const seedTeamMembers = async () => {
  const teamMembers = [
    {
      title: "Alex Kimani",
      slug: "team-alex-kimani",
      content: "Lead outdoor educator with 10+ years of experience in adventure learning and youth development.",
      content_type: "team_member" as const,
      status: "published" as const,
      metadata: {
        role: "Lead Educator",
        image_url: "",
        specialization: "Adventure Education",
        icon: "compass",
        order: 1,
      },
    },
    {
      title: "Mary Wanjiru",
      slug: "team-mary-wanjiru",
      content: "Specialist in early childhood development and nature-based learning for young explorers.",
      content_type: "team_member" as const,
      status: "published" as const,
      metadata: {
        role: "Early Childhood Specialist",
        image_url: "",
        specialization: "Child Development",
        icon: "baby",
        order: 2,
      },
    },
    {
      title: "David Ochieng",
      slug: "team-david-ochieng",
      content: "Environmental educator focused on sustainable practices and conservation awareness.",
      content_type: "team_member" as const,
      status: "published" as const,
      metadata: {
        role: "Environmental Educator",
        image_url: "",
        specialization: "Conservation",
        icon: "leaf",
        order: 3,
      },
    },
  ];

  console.log("Seeding team members...");
  for (const member of teamMembers) {
    await cmsService.createContent(member);
  }
  console.log("✓ Team members seeded");
};

export const seedSiteSettings = async () => {
  const siteSettings = {
    title: "Site Settings",
    slug: "site-settings",
    content: "",
    content_type: "site_settings" as const,
    status: "published" as const,
    metadata: {
      footer_description:
        "Amuse.Ke offers transformative outdoor education experiences that inspire growth, build confidence, and foster a deep connection with nature.",
      contact_phone: "+254 700 000 000",
      contact_email: "info@amuse.ke",
      contact_address: "Karura Forest, Sigiria Ridge (Gate F), Nairobi, Kenya",
      contact_hours: "Mon-Fri: 8AM-5PM, Sat-Sun: 9AM-4PM",
      social_instagram: "https://instagram.com/amuse.ke",
      social_twitter: "https://twitter.com/amuseke",
      social_facebook: "https://facebook.com/amuse.ke",
      copyright: "© 2025 Amuse.Ke. All rights reserved.",
    },
  };

  console.log("Seeding site settings...");
  await cmsService.createContent(siteSettings);
  console.log("✓ Site settings seeded");
};

export const seedAllContent = async () => {
  console.log("🌱 Starting CMS content seeding...\n");

  try {
    await seedAboutSections();
    await seedServiceItems();
    await seedHeroSlides();
    await seedPrograms();
    await seedTestimonials();
    await seedTeamMembers();
    await seedSiteSettings();

    console.log("\n✅ All CMS content successfully seeded!");
    return true;
  } catch (error) {
    console.error("❌ Error seeding content:", error);
    return false;
  }
};
