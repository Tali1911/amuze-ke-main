import React from 'react';
import { Label } from '@/components/ui/label';
import TypographyControls from './TypographyControls';
import { TypographyStyle } from '@/lib/typography';

interface FieldLabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  typography?: TypographyStyle;
  onTypographyChange?: (v: TypographyStyle | undefined) => void;
  /** Popover label, defaults to `${children} typography`. */
  typographyLabel?: string;
  className?: string;
}

/**
 * Label + inline typography controls, so every editable text field in the CMS
 * can expose per-field font/size/weight/alignment/color without repeating
 * layout code in each editor.
 */
const FieldLabel: React.FC<FieldLabelProps> = ({
  htmlFor,
  children,
  typography,
  onTypographyChange,
  typographyLabel,
  className,
}) => {
  return (
    <div className={`flex items-center justify-between gap-2 mb-1 ${className || ''}`}>
      <Label htmlFor={htmlFor} className="mb-0">{children}</Label>
      {onTypographyChange && (
        <TypographyControls
          value={typography}
          onChange={onTypographyChange}
          label={typographyLabel || (typeof children === 'string' ? `${children} typography` : 'Typography')}
        />
      )}
    </div>
  );
};

export default FieldLabel;
