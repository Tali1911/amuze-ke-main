import React from 'react';
import { ContentItem } from '@/services/cmsService';
import { typographyToStyle, TypographyStyle } from '@/lib/typography';

interface Props {
  section: ContentItem;
}

const CustomAboutSection: React.FC<Props> = ({ section }) => {
  const meta = section.metadata || {};
  const bg = meta.background_color || '#ffffff';
  const imageUrl: string | undefined = meta.image_url;
  const align: 'left' | 'right' | 'center' = meta.image_alignment || 'left';
  const subtitle: string | undefined = meta.subtitle;
  const subtitle2: string | undefined = meta.subtitle_2;
  const eyebrow: string | undefined = meta.eyebrow;
  const typography: Record<string, TypographyStyle | undefined> = meta.typography || {};

  // Text color helper: pick dark or light based on bg
  const textOnBg = React.useMemo(() => {
    try {
      const hex = bg.replace('#', '');
      if (hex.length !== 6) return '#1f2937';
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.6 ? '#1f2937' : '#ffffff';
    } catch {
      return '#1f2937';
    }
  }, [bg]);

  const hasImage = !!imageUrl;
  const isCenter = align === 'center' || !hasImage;

  const eyebrowStyle = typographyToStyle(typography.eyebrow);
  const titleStyle = typographyToStyle(typography.title);
  const subtitleStyle = typographyToStyle(typography.subtitle);
  const subtitle2Style = typographyToStyle(typography.subtitle_2);
  const bodyStyle = typographyToStyle(typography.body);

  return (
    <section style={{ backgroundColor: bg, color: textOnBg }} className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        {isCenter ? (
          <div className="text-center max-w-3xl mx-auto">
            {eyebrow && (
              <span
                style={eyebrowStyle}
                className="inline-block text-xs font-semibold tracking-widest uppercase mb-3 opacity-80"
              >
                {eyebrow}
              </span>
            )}
            <h2 style={titleStyle} className="text-3xl md:text-4xl font-bold mb-4">{section.title}</h2>
            {subtitle && <p style={subtitleStyle} className="text-lg mb-3 opacity-90">{subtitle}</p>}
            {subtitle2 && <p style={subtitle2Style} className="text-base mb-6 opacity-80">{subtitle2}</p>}
            {section.content && (
              <p style={bodyStyle} className="text-base leading-relaxed opacity-90 whitespace-pre-line">{section.content}</p>
            )}
            {hasImage && (
              <div className="mt-8">
                <img src={imageUrl} alt={section.title} className="rounded-lg mx-auto max-h-[420px] object-cover" />
              </div>
            )}
          </div>
        ) : (
          <div
            className={`grid md:grid-cols-2 gap-10 items-center ${
              align === 'right' ? 'md:[&>*:first-child]:order-2' : ''
            }`}
          >
            <div>
              <img
                src={imageUrl}
                alt={section.title}
                className="rounded-lg w-full max-h-[480px] object-cover shadow-md"
              />
            </div>
            <div>
              {eyebrow && (
                <span
                  style={eyebrowStyle}
                  className="inline-block text-xs font-semibold tracking-widest uppercase mb-3 opacity-80"
                >
                  {eyebrow}
                </span>
              )}
              <h2 style={titleStyle} className="text-3xl md:text-4xl font-bold mb-4">{section.title}</h2>
              {subtitle && <p style={subtitleStyle} className="text-lg mb-3 opacity-90">{subtitle}</p>}
              {subtitle2 && <p style={subtitle2Style} className="text-base mb-4 opacity-80">{subtitle2}</p>}
              {section.content && (
                <p style={bodyStyle} className="text-base leading-relaxed opacity-90 whitespace-pre-line">{section.content}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomAboutSection;
