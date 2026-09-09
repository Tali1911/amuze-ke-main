import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ContentItem } from '@/services/cmsService';
import { typographyToStyle, TypographyStyle } from '@/lib/typography';

export interface HomeCard {
  id: string;
  image_url?: string;
  title?: string;
  body?: string;
  badge?: string;
  link_type?: 'internal' | 'external';
  link_to?: string;
  link_label?: string;
  typography?: {
    title?: TypographyStyle;
    body?: TypographyStyle;
    badge?: TypographyStyle;
  };
}

interface Props {
  section: ContentItem;
}

const COL_CLASS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

const CardsGridSection: React.FC<Props> = ({ section }) => {
  const m = section.metadata || {};
  const t: Record<string, TypographyStyle | undefined> = m.typography || {};
  const cards: HomeCard[] = Array.isArray(m.cards) ? m.cards : [];
  const columns: number = [2, 3, 4].includes(m.columns) ? m.columns : 3;
  const bg = m.background_color || undefined;

  const renderCardInner = (card: HomeCard) => (
    <div className="group h-full flex flex-col bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
      {card.image_url && (
        <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
          <img
            src={card.image_url}
            alt={card.title || ''}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
        {card.badge && (
          <span
            style={typographyToStyle(card.typography?.badge)}
            className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-2"
          >
            {card.badge}
          </span>
        )}
        {card.title && (
          <h3
            style={typographyToStyle(card.typography?.title)}
            className="text-lg font-semibold mb-2 text-foreground"
          >
            {card.title}
          </h3>
        )}
        {card.body && (
          <p
            style={typographyToStyle(card.typography?.body)}
            className="text-sm text-muted-foreground flex-1"
          >
            {card.body}
          </p>
        )}
        {(card.link_to || card.link_label) && (
          <span className="mt-4 inline-flex items-center text-sm font-medium text-primary group-hover:underline">
            {card.link_label || 'Learn more'}
            <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    </div>
  );

  const renderCard = (card: HomeCard) => {
    if (!card.link_to) {
      return <div key={card.id}>{renderCardInner(card)}</div>;
    }
    if (card.link_type === 'external') {
      return (
        <a key={card.id} href={card.link_to} target="_blank" rel="noopener noreferrer" className="block h-full">
          {renderCardInner(card)}
        </a>
      );
    }
    return (
      <Link key={card.id} to={card.link_to} className="block h-full">
        {renderCardInner(card)}
      </Link>
    );
  };

  const hasHeader = section.title || m.subtitle || m.eyebrow;

  return (
    <div className="py-12 md:py-16" style={bg ? { backgroundColor: bg } : undefined}>
      <div className="container mx-auto max-w-6xl px-4">
        {hasHeader && (
          <div className="text-center max-w-3xl mx-auto mb-10">
            {m.eyebrow && (
              <span
                style={typographyToStyle(t.eyebrow)}
                className="inline-block text-xs font-semibold tracking-widest uppercase mb-2 text-primary"
              >
                {m.eyebrow}
              </span>
            )}
            {section.title && (
              <h2 style={typographyToStyle(t.title)} className="text-3xl md:text-4xl font-bold mb-3">
                {section.title}
              </h2>
            )}
            {m.subtitle && (
              <p style={typographyToStyle(t.subtitle)} className="text-base md:text-lg text-muted-foreground">
                {m.subtitle}
              </p>
            )}
          </div>
        )}

        {cards.length > 0 ? (
          <div className={`grid grid-cols-1 ${COL_CLASS[columns]} gap-6`}>
            {cards.map(renderCard)}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">No cards added to this section yet.</p>
        )}
      </div>
    </div>
  );
};

export default CardsGridSection;
