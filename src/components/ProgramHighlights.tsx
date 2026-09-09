import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Calendar, MapPin, Baby, GraduationCap, PartyPopper, Mountain } from "lucide-react";
import homeschoolingImage from "@/assets/schools.jpg";
import dailyActivitiesImage from "@/assets/daily-activities.jpg";
import adventureImage from "@/assets/adventure.jpg";
import birthdayImage from "@/assets/birthday.jpg";

const ProgramHighlights = () => {
  const programs = [
    {
      id: "homeschooling",
      title: "Homeschooling Outdoor Experiences",
      description: "Structured integration of physical education and nature immersion with sports modules.",
      image: homeschoolingImage,
      icon: GraduationCap,
      ageRange: "4-17 years",
      duration: "1 day - 4 weeks",
      highlights: ["STEM Integration", "Physical Education", "Nature Immersion", "Sports Modules"],
    },
    {
      id: "little-forest",
      title: "Little Forest Explorers",
      description: "Nurture sensory exploration, early language acquisition (Swahili focus), and motor development.",
      image: dailyActivitiesImage,
      icon: Baby,
      ageRange: "3 & below",
      duration: "Mon/Fri options",
      highlights: ["Sensory Play", "Language Development", "Motor Skills", "Swahili Focus"],
    },
    {
      id: "school-experience",
      title: "School Adventures",
      description: "Curriculum-aligned outdoor education, field trips, forest school experiences, and sleep-away camps.",
      image: homeschoolingImage,
      icon: GraduationCap,
      ageRange: "6-17 years",
      duration: "1-5 days",
      highlights: ["Forest Days", "Field Trips", "Industrial Visits", "Sleep-Away Camps"],
    },
    {
      id: "team-building",
      title: "Team Building ",
      description: "Create safe, fun, memory-filled experiences with measurable outcomes.",
      image: birthdayImage,
      icon: PartyPopper,
      ageRange: "All ages",
      duration: "Half/Full day",
      highlights: ["Team Communication", "Problem-Solving", "90% Fun + 10% Reflection", "Custom Events"],
    },
    {
      id: "kenyan-experiences",
      title: "Kenyan Experiences (5-Day)",
      description: "Progressive camps building resilience, teamwork, cultural awareness, and outdoor confidence.",
      image: adventureImage,
      icon: Mountain,
      ageRange: "9-17 years",
      duration: "5 days",
      highlights: ["Mt Kenya", "Coast", "Mara", "Cultural Immersion"],
    },
    {
      id: "day-camps",
      title: "Day Camps (Nairobi Circuit)",
      description: "Structured daily experiences to build confidence, friendships, and life skills.",
      image: dailyActivitiesImage,
      icon: Users,
      ageRange: "3-17 years",
      duration: "Daily programs",
      highlights: ["Karura Gate F", "Age-Appropriate", "Life Skills", "Nature Connection"],
    },
  ];

  return (
    <section className="py-24 px-4" id="programs">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-primary mb-6">Choose Your Adventure</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover our range of outdoor education programs designed to inspire, educate, and create lasting memories
            through nature-based learning experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program) => {
            const IconComponent = program.icon;
            return (
              <Card
                key={program.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-card"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <div className="bg-primary/90 rounded-full p-3">
                      <IconComponent className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white mb-2">{program.title}</h3>
                    <div className="flex items-center gap-4 text-white/80 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{program.ageRange}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{program.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-muted-foreground mb-4 leading-relaxed">{program.description}</p>

                  <div className="mb-6">
                    <h4 className="font-semibold text-sm text-primary mb-3">Program Highlights</h4>
                    <div className="flex flex-wrap gap-2">
                      {program.highlights.map((highlight, index) => (
                        <span key={index} className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full">
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link to={`/programs/${program.id}`}>
                    <Button className="w-full group">
                      Learn More & Register
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-16">
          <Card className="bg-primary/5 border-primary/20 p-8">
            <h3 className="text-2xl font-bold text-primary mb-4">Not sure which program is right for you?</h3>
            <p className="text-muted-foreground mb-6">
              Contact our team for personalized recommendations based on your child's age, interests, and learning
              goals.
            </p>
            <Link to="/contact">
              <Button variant="outline" size="lg">
                Get Personal Recommendations
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProgramHighlights;
