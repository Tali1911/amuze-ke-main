import React from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import HomeschoolingProgram from "@/components/forms/HomeschoolingProgram";
import LittleForestProgram from "@/components/forms/LittleForestProgram";
import SchoolExperienceProgram from "@/components/forms/SchoolExperienceProgram";
import TeamBuildingProgram from "@/components/forms/TeamBuildingProgram";
import KenyanExperiencesProgram from "@/components/forms/KenyanExperiencesProgram";
import DayCampsProgram from "@/components/forms/DayCampsProgram";
import NotFound from "@/pages/NotFound";

const programSEO: Record<string, { title: string; description: string; keywords: string }> = {
  homeschooling: {
    title: "Homeschooling Outdoor Experiences | Amuse Kenya",
    description:
      "Nature-based outdoor education for homeschooling families. Physical education, STEM integration, and nature immersion for ages 4-17 at Karura Forest.",
    keywords: "homeschooling Kenya, outdoor education, nature learning, physical education homeschool",
  },
  "little-forest": {
    title: "The Little Forest Explorers (Ages 3 & below) | Amuse Kenya",
    description:
      "Gentle nature introduction for toddlers aged 3 and Below. Sensory play, nature crafts, mini hikes, and forest exploration at Karura Forest, Nairobi.",
    keywords: "toddler outdoor activities Nairobi, little forest, nature play kids, early childhood outdoor Kenya",
  },
  "school-experience": {
    title: "School Experience & Field Trips | Amuse Kenya",
    description:
      "Educational field trips and outdoor learning for schools at Karura Forest. Age-appropriate nature programs and team adventures for school groups in Nairobi.",
    keywords: "school field trips Nairobi, school outdoor programs Kenya, educational excursions, nature school visits",
  },
  "team-building": {
    title: "Team Building Programs | Amuse Kenya",
    description:
      "Corporate and school team building at Karura Forest. Challenge courses, problem-solving, and collaborative adventures for groups.",
    keywords: "team building Nairobi, corporate events Kenya, outdoor team activities",
  },
  "kenyan-experiences": {
    title: "Kenyan Experiences | Amuse Kenya Cultural Tours",
    description:
      "Authentic Kenyan cultural and nature experiences. Guided tours, wildlife encounters, and educational programs across Kenya.",
    keywords: "Kenyan experiences, cultural tours, wildlife Kenya, nature tours",
  },
  "day-camps": {
    title: "Day Camps & Daily Adventures | Amuse Kenya",
    description:
      "Daily outdoor adventure programs for children at Karura Forest. Horse riding, bushcraft, archery, rope courses, and nature exploration.",
    keywords: "day camps Nairobi, daily kids activities, outdoor adventures Karura Forest",
  },
};

const ProgramDetail = () => {
  const { programId } = useParams();
  const seo = programSEO[programId || ""];

  const renderProgram = () => {
    switch (programId) {
      case "homeschooling":
        return <HomeschoolingProgram />;
      case "little-forest":
        return <LittleForestProgram />;
      case "school-experience":
        return <SchoolExperienceProgram />;
      case "team-building":
        return <TeamBuildingProgram />;
      case "kenyan-experiences":
        return <KenyanExperiencesProgram />;
      case "day-camps":
        return <DayCampsProgram campTitle="Nairobi Day Camps" />;
      default:
        return <NotFound />;
    }
  };

  return (
    <>
      {seo && (
        <SEOHead
          title={seo.title}
          description={seo.description}
          keywords={seo.keywords}
          canonical={`https://amusekenya.co.ke/programs/${programId}`}
        />
      )}
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20">{renderProgram()}</div>
        <Footer />
      </div>
    </>
  );
};

export default ProgramDetail;
