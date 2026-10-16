import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CampChild } from '@/types/campRegistration';

export const AllergyCell: React.FC<{ children?: CampChild[]; child?: CampChild }> = ({ children, child }) => {
  const list = child ? [child] : (children || []);
  const notes = list
    .filter(c => c?.specialNeeds && c.specialNeeds.trim() && c.specialNeeds !== 'Accompanied by Nanny')
    .map(c => (child ? c.specialNeeds!.trim() : `${c.childName}: ${c.specialNeeds!.trim()}`));
  if (notes.length === 0) return <span className="text-xs text-muted-foreground">None</span>;
  const text = notes.join('; ');
  return (
    <Badge variant="destructive" className="text-xs max-w-[180px] truncate block w-fit" title={text}>
      {text}
    </Badge>
  );
};

export const MediaConsentCell: React.FC<{ consent?: boolean }> = ({ consent }) => (
  <Badge variant={consent ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
    {consent ? 'Yes' : 'No'}
  </Badge>
);
