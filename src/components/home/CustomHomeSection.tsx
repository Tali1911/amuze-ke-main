import React from 'react';
import { ContentItem } from '@/services/cmsService';
import CustomAboutSection from '@/components/about/CustomAboutSection';

/**
 * Home-page custom section. Rendering rules are identical to About custom
 * sections (background, image alignment, per-field typography), so we simply
 * delegate to the About renderer.
 */
const CustomHomeSection: React.FC<{ section: ContentItem }> = ({ section }) => (
  <CustomAboutSection section={section} />
);

export default CustomHomeSection;
