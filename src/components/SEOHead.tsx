import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  structuredData?: object;
}

const DOMAIN = 'https://amusekenya.co.ke';

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Amuse Kenya | Kids Camps & Programs in Nairobi",
  description = "Forest adventures for kids aged 3-17 at Karura Forest, Nairobi. Camps, parties, school programs & team building. Book your outdoor experience!",
  keywords = "kids camps Nairobi, outdoor activities for children Kenya, holiday camps Karura Forest, birthday parties Nairobi, school programs Kenya, team building kids, nature education, forest adventures",
  canonical = `${DOMAIN}/`,
  ogTitle,
  ogDescription,
  ogImage = `${DOMAIN}/og-image.png`,
  ogType = "website",
  twitterTitle,
  twitterDescription,
  structuredData
}) => {
  // Ensure OG image is absolute
  const absoluteOgImage = ogImage?.startsWith('http') ? ogImage : `${DOMAIN}${ogImage}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Amuse Kenya" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={ogTitle || title} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Amuse Kenya" />
      <meta property="og:locale" content="en_KE" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={twitterTitle || ogTitle || title} />
      <meta name="twitter:description" content={twitterDescription || ogDescription || description} />
      <meta name="twitter:image" content={absoluteOgImage} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
