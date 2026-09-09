
import React from 'react';
import { sanitizeHtml } from '@/utils/sanitize';

interface ContentRendererProps {
  content: string;
  contentType: 'text' | 'html' | 'markdown';
  className?: string;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ 
  content, 
  contentType, 
  className = '' 
}) => {
  if (contentType === 'html') {
    return (
      <div 
        className={`prose prose-gray max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
      />
    );
  }

  if (contentType === 'markdown') {
    // For now, treat markdown as text. In the future, add a markdown parser
    return <div className={className}>{content}</div>;
  }

  // Default to text
  return <div className={className}>{content}</div>;
};

export default ContentRenderer;
