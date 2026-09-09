import React from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Target } from 'lucide-react';

interface ActivityTypeSelectorProps {
  value: 'camp' | 'archery';
  onChange: (value: 'camp' | 'archery') => void;
  archeryRate: number;
  currency: string;
}

export const ActivityTypeSelector: React.FC<ActivityTypeSelectorProps> = ({
  value,
  onChange,
  archeryRate,
  currency,
}) => {
  return (
    <div className="border-2 border-accent rounded-lg p-4 bg-accent/10">
      <Label className="text-sm font-medium flex items-center gap-2 mb-3">
        <Target className="w-4 h-4" />
        Activity Type
      </Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as 'camp' | 'archery')}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="camp" id="activity-camp" />
          <Label htmlFor="activity-camp" className="cursor-pointer text-sm">
            Camp Activities (Half/Full Day)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="archery" id="activity-archery" />
          <Label htmlFor="activity-archery" className="cursor-pointer text-sm">
            Archery Only (45 mins) — {currency} {archeryRate.toLocaleString()}/session
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};
