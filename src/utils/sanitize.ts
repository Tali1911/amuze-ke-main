import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify which is a trusted, well-maintained library
 */
export const sanitizeHtml = (dirty: string | null | undefined): string => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike', 'sub', 'sup',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img', 'figure', 'figcaption', 'picture', 'source',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'hr',
      'iframe', 'video'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id',
      'width', 'height', 'style', 'data-banner',
      'allow', 'allowfullscreen', 'frameborder', 'loading', 'controls',
      'poster', 'muted', 'playsinline', 'srcset', 'sizes', 'type'
    ],
    ALLOW_DATA_ATTR: true,
    ADD_ATTR: ['target'],
    ADD_TAGS: ['iframe'],
    FORCE_BODY: true
  });
};

/**
 * Sanitize HTML and strip all tags - returns plain text only
 */
export const stripHtmlTags = (dirty: string | null | undefined): string => {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};

export default sanitizeHtml;
