
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface TeamMemberCardProps {
  member: {
    id: string;
    name: string;
    role: string;
    bio: string;
    shortDescription?: string;
    image: string;
    specialization: string;
    icon: string;
  };
  index: number;
  onClick: () => void;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ member, index, onClick }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  const displayDescription = member.shortDescription || member.bio.substring(0, 100) + '...';

  return (
    <Card 
      key={member.id || index} 
      className="fade-in-element hover:shadow-lg transition-all duration-700 cursor-pointer opacity-100"
      onClick={onClick}
    >
      <div className="relative overflow-hidden aspect-square">
        <div 
          className={`w-full h-full bg-gray-200 absolute top-0 left-0 transition-opacity duration-500 ${
            isImageLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        ></div>
        <img 
          src={member.image} 
          alt={member.name} 
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: isImageLoaded ? 1 : 0 }}
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            // Fallback for broken images
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d';
            setIsImageLoaded(true);
          }}
        />
      </div>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-foreground mb-1">{member.name}</h3>
        <p className="text-forest-600 font-medium mb-3">{member.role}</p>
        <p className="text-muted-foreground text-sm line-clamp-2">{displayDescription}</p>
      </CardContent>
    </Card>
  );
};
