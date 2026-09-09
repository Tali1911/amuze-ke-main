import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ContentItem } from '@/services/cmsService';
import { Target, Eye, Heart, CheckCircle, Leaf, Users, Smile, Globe } from 'lucide-react';

const iconMap: Record<string, any> = {
  Target,
  Eye,
  Heart,
  CheckCircle,
  Leaf,
  Users,
  Smile,
  Globe,
};

interface PillarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pillar: ContentItem | null;
}

const PillarDialog: React.FC<PillarDialogProps> = ({ isOpen, onClose, pillar }) => {
  if (!pillar) return null;

  const IconComponent = iconMap[pillar.metadata?.icon || 'Target'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              {IconComponent && <IconComponent className="h-6 w-6 text-primary" />}
            </div>
            {pillar.title}
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed pt-4 text-foreground">
            {pillar.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-3 whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default PillarDialog;
