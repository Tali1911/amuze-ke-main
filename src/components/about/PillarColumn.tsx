import React from 'react';
import { ContentItem } from '@/services/cmsService';

interface PillarColumnProps {
  pillar: ContentItem;
  color: string;
  onClick: () => void;
}

const PillarColumn: React.FC<PillarColumnProps> = ({ pillar, color, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-105 group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View details about ${pillar.title}`}
    >
      {/* Column Capital (top decoration) */}
      <div className="w-full flex flex-col gap-1 mb-2">
        <div className="h-1 bg-foreground/80 w-full rounded-sm"></div>
        <div className="h-1 bg-foreground/60 w-11/12 mx-auto rounded-sm"></div>
        <div className="h-1 bg-foreground/40 w-10/12 mx-auto rounded-sm"></div>
      </div>

      {/* Column Shaft */}
      <div
        className="relative w-10 sm:w-14 md:w-20 lg:w-24 h-40 sm:h-52 md:h-72 lg:h-80 rounded-b-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: color }}
      >
        {/* Vertical text */}
        <div
          className="text-white font-bold text-xs sm:text-sm md:text-lg lg:text-xl tracking-wider"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
          }}
        >
          {pillar.title.toUpperCase()}
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Column Base (bottom decoration) */}
      <div className="w-full flex items-center justify-center gap-2 mt-2">
        <div className="w-2 h-2 rounded-full bg-foreground/60"></div>
        <div className="w-2 h-2 rounded-full bg-foreground/60"></div>
        <div className="w-2 h-2 rounded-full bg-foreground/60"></div>
      </div>
    </div>
  );
};

export default PillarColumn;
