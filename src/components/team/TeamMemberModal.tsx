import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, Phone, Trophy, Heart, Users, Briefcase, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  shortDescription?: string;
  image: string;
  specialization: string;
  icon: string;
}

interface TeamMemberModalProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ member, isOpen, onClose }) => {
  if (!member) return null;

  const renderIcon = (iconName: string) => {
    const iconProps = { className: "h-5 w-5 text-forest-500" };
    
    switch(iconName) {
      case 'Trophy':
        return <Trophy {...iconProps} />;
      case 'Heart':
        return <Heart {...iconProps} />;
      case 'Briefcase':
        return <Briefcase {...iconProps} />;
      case 'Leaf':
        return <Leaf {...iconProps} />;
      case 'Users':
        return <Users {...iconProps} />;
      default:
        return <Trophy {...iconProps} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{member.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <img 
                src={member.image} 
                alt={member.name} 
                className="w-full aspect-square object-cover rounded-lg"
              />
            </div>
            
            <div className="md:w-2/3 space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground">{member.name}</h2>
                <p className="text-lg text-forest-600 font-medium mt-1">{member.role}</p>
              </div>
              
              <div className="flex items-center text-foreground">
                {renderIcon(member.icon)}
                <span className="ml-2 font-medium">{member.specialization}</span>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">About</h3>
            <p className="text-muted-foreground leading-relaxed">{member.bio}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
