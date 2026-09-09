import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface RelatedProgram {
  title: string;
  description: string;
  path: string;
}

interface RelatedProgramsProps {
  currentPath: string;
}

const ALL_PROGRAMS: RelatedProgram[] = [
  { title: 'Day Camps', description: 'Daily outdoor adventure programs at Karura Forest', path: '/camps/day-camps' },
  { title: 'Summer Camp', description: 'Adventure-packed holiday camps with nature activities', path: '/camps/summer' },
  { title: 'Easter Camp', description: 'Easter holiday camp with games and exploration', path: '/camps/easter' },
  { title: 'Mid-Term Camp', description: 'Mid-term break adventure programs for children', path: '/camps/mid-term' },
  { title: 'End of Year Camp', description: 'Year-end celebration camps with outdoor fun', path: '/camps/end-year' },
  { title: 'Birthday Parties', description: 'Magical birthday celebrations in the forest', path: '/group-activities/parties' },
  { title: 'Team Building', description: 'Corporate and school team-building adventures', path: '/group-activities/team-building' },
  { title: 'Homeschooling', description: 'Nature-based learning programs for homeschoolers', path: '/programs/homeschooling' },
  { title: 'School Experience', description: 'Collaborative nature programs for schools', path: '/programs/school-experience' },
  { title: 'Kenyan Experiences', description: 'Cultural and nature experiences across Kenya', path: '/experiences/kenyan-experiences' },
];

const RelatedPrograms: React.FC<RelatedProgramsProps> = ({ currentPath }) => {
  const related = ALL_PROGRAMS.filter(p => p.path !== currentPath).slice(0, 3);

  return (
    <section className="mt-16 mb-8">
      <h2 className="text-2xl font-bold text-primary mb-6">Explore More Programs</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {related.map((program) => (
          <Link
            key={program.path}
            to={program.path}
            className="group block p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-primary group-hover:text-primary/80 mb-2">
              {program.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">{program.description}</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              Learn more <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedPrograms;
