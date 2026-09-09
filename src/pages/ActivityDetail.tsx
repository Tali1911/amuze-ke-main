import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { cmsService, ContentItem } from '@/services/cmsService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { sanitizeHtml } from '@/utils/sanitize';

const ActivityDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadActivity = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      const data = await cmsService.getContentBySlug(slug, 'activity_detail');
      
      console.log('Activity data fetched:', data);
      console.log('Slug:', slug);
      
      if (!data) {
        console.error('No content found for slug:', slug);
        setNotFound(true);
      } else if (data.content_type !== 'activity_detail') {
        console.error('Content found but wrong type:', data.content_type);
        setNotFound(true);
      } else if (data.status !== 'published') {
        console.error('Content found but not published. Status:', data.status);
        setNotFound(true);
      } else {
        setActivity(data);
      }
      
      setIsLoading(false);
    };

    loadActivity();
  }, [slug]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Footer />
      </>
    );
  }

  if (notFound || !activity) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Activity Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The activity you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  const metaTitle = activity.metadata?.meta_title || activity.title;
  const metaDescription = activity.metadata?.meta_description || 
    activity.content?.replace(/<[^>]*>/g, '').substring(0, 160);
  const featuredImage = activity.metadata?.featured_image;

  return (
    <>
      <SEOHead 
        title={metaTitle}
        description={metaDescription}
        canonical={`https://amusekenya.co.ke/activity/${slug}`}
      />
      
      <Navbar />
      
      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="bg-muted/30 border-b">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-foreground">{activity.title}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        {featuredImage && (
          <div className="relative h-[400px] overflow-hidden">
            <img 
              src={featuredImage} 
              alt={activity.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/20" />
            <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 py-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                {activity.title}
              </h1>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          {!featuredImage && (
            <h1 className="text-4xl md:text-5xl font-bold mb-8">
              {activity.title}
            </h1>
          )}

          <div 
            className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(activity.content) }}
          />

          {/* CTA Section */}
          <div className="mt-12 p-8 bg-primary/5 rounded-lg border border-primary/20 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Experience This Adventure?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Get in touch with us to learn more about this activity, check availability, 
              or book your experience today.
            </p>
            <Button 
              size="lg"
              onClick={() => navigate('/contact')}
              className="min-w-[200px]"
            >
              <Mail className="mr-2 h-5 w-5" />
              Contact Us
            </Button>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ActivityDetail;
