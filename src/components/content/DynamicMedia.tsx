import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface DynamicMediaProps {
  mediaType?: 'photo' | 'video';
  mediaUrl?: string;
  fallbackImage: string;
  thumbnailUrl?: string;
  altText?: string;
  className?: string;
  isLoading?: boolean;
}

const DynamicMedia: React.FC<DynamicMediaProps> = ({
  mediaType = 'photo',
  mediaUrl,
  fallbackImage,
  thumbnailUrl,
  altText = 'Media content',
  className = 'w-full h-full object-cover',
  isLoading = false,
}) => {
  // Show skeleton when loading
  if (isLoading) {
    return <Skeleton className={className} />;
  }

  const src = mediaUrl || fallbackImage;

  if (mediaType === 'video' && mediaUrl) {
    return (
      <video
        src={mediaUrl}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        poster={thumbnailUrl || undefined}
      >
        <source src={mediaUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <img
      src={src}
      alt={altText}
      className={className}
    />
  );
};

export default DynamicMedia;
