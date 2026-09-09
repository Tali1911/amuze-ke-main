import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, RotateCcw, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import {
  TypographyStyle,
  TYPOGRAPHY_FONT_OPTIONS,
  TYPOGRAPHY_SIZE_OPTIONS,
  TYPOGRAPHY_WEIGHT_OPTIONS,
  TYPOGRAPHY_COLOR_SWATCHES,
  hasTypography,
} from '@/lib/typography';

interface TypographyControlsProps {
  value?: TypographyStyle | null;
  onChange: (value: TypographyStyle | undefined) => void;
  /** Optional label shown at top of the popover, e.g. "Title typography". */
  label?: string;
}

/**
 * Inline typography editor. Renders a small icon button that opens a popover
 * with font-family, size, weight, alignment, and color controls. Emits an
 * updated `TypographyStyle` (or `undefined` when fully reset).
 */
const TypographyControls: React.FC<TypographyControlsProps> = ({ value, onChange, label }) => {
  const v = value || {};
  const active = hasTypography(value);

  const patch = (partial: Partial<TypographyStyle>) => {
    const next: TypographyStyle = { ...v, ...partial };
    // Drop empty keys so `hasTypography` stays truthful.
    (Object.keys(next) as (keyof TypographyStyle)[]).forEach(k => {
      const val = next[k];
      if (val === '' || val === undefined || val === null) delete next[k];
    });
    if (!hasTypography(next)) onChange(undefined);
    else onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={`h-8 w-8 shrink-0 ${active ? 'border-primary text-primary' : ''}`}
          aria-label="Typography options"
          title="Font, size, weight, alignment, color"
        >
          <Type className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 space-y-3" align="end">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            {label || 'Typography'}
          </p>
          {active && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onChange(undefined)}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Font</Label>
          <Select
            value={v.fontFamily || ''}
            onValueChange={(val) => patch({ fontFamily: val as any })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              {TYPOGRAPHY_FONT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  <span style={{ fontFamily: o.css }}>{o.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Size</Label>
            <Select
              value={v.fontSize || ''}
              onValueChange={(val) => patch({ fontSize: val as any })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                {TYPOGRAPHY_SIZE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Weight</Label>
            <Select
              value={v.fontWeight || ''}
              onValueChange={(val) => patch({ fontWeight: val as any })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                {TYPOGRAPHY_WEIGHT_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Alignment</Label>
          <div className="flex gap-1">
            {([
              { v: 'left', icon: AlignLeft },
              { v: 'center', icon: AlignCenter },
              { v: 'right', icon: AlignRight },
            ] as const).map(({ v: av, icon: Icon }) => (
              <Button
                key={av}
                type="button"
                variant={v.align === av ? 'default' : 'outline'}
                size="sm"
                className="h-8 flex-1"
                onClick={() => patch({ align: v.align === av ? undefined : av })}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Color</Label>
          <div className="flex flex-wrap gap-1.5">
            {TYPOGRAPHY_COLOR_SWATCHES.map(sw => (
              <button
                key={sw.value}
                type="button"
                title={sw.label}
                onClick={() => patch({ color: v.color === sw.value ? undefined : sw.value })}
                className={`h-6 w-6 rounded border transition ${
                  v.color === sw.value ? 'ring-2 ring-primary ring-offset-1' : 'border-border'
                }`}
                style={{ backgroundColor: sw.value }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Input
              type="color"
              value={v.color || '#000000'}
              onChange={(e) => patch({ color: e.target.value })}
              className="w-10 h-8 p-1"
            />
            <Input
              type="text"
              value={v.color || ''}
              placeholder="#hex or css color"
              onChange={(e) => patch({ color: e.target.value || undefined })}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TypographyControls;
