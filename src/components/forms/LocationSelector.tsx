import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface LocationSelectorProps {
  locations: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  value,
  onChange,
  label = 'Location'
}) => {
  if (!locations || locations.length === 0) return null;

  return (
    <div>
      <Label className="text-base font-medium flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {label} *
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-2">
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {loc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
