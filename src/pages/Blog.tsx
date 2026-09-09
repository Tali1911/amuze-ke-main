import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, User } from 'lucide-react';
import { cmsService, ContentItem } from '@/services/cmsService';
import { sanitizeHtml } from '@/utils/sanitize';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const Blog = () => {
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPosts();
    const handler = () => loadPosts();
    window.addEventListener('cms-content-updated', handler);
    return () => window.removeEventListener('cms-content-updated', handler);
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    const data = await cmsService.getAllContent('post');
    setPosts(data.filter(p => p.status === 'published').sort((a, b) => 
      new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
    ));
    setIsLoading(false);
  };

  const getFeaturedImage = (post: ContentItem) => post.metadata?.featured_image || null;
  const getExcerpt = (post: ContentItem) => {
    if (post.metadata?.excerpt) return post.metadata.excerpt;
    if (post.content) {
      const text = post.content.replace(/<[^>]*>/g, '');
      return text.length > 160 ? text.substring(0, 160) + '...' : text;
    }
    return '';
  };
  const getReadTime = (post: ContentItem) => {
    if (!post.content) return '1 min read';
    const words = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return `${Math.max(1, Math.ceil(words / 200))} min read`;
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Amuse Kenya Blog",
    "description": "Stories, tips and updates from Amuse Kenya's outdoor adventures and education programs at Karura Forest.",
    "url": "https://amusekenya.co.ke/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Amuse Kenya",
      "logo": { "@type": "ImageObject", "url": "https://amusekenya.co.ke/og-image.png" }
    }
  };

  return (
    <>
      <SEOHead
        title="Blog - Amuse Kenya | Adventures & Outdoor Education"
        description="Read the latest stories, tips and updates from Amuse Kenya's forest adventures and outdoor education programs at Karura Forest, Nairobi."
        keywords="Amuse Kenya blog, outdoor education blog, Karura Forest stories, children adventure tips, nature education Kenya"
        canonical="https://amusekenya.co.ke/blog"
        ogType="blog"
        structuredData={structuredData}
      />
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-primary/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Our Blog</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stories, tips and updates from our forest adventures and outdoor education programs.
            </p>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-xl h-48 mb-4" />
                  <div className="bg-muted h-6 rounded w-3/4 mb-2" />
                  <div className="bg-muted h-4 rounded w-full mb-1" />
                  <div className="bg-muted h-4 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold text-foreground mb-2">No posts yet</h2>
              <p className="text-muted-foreground">Check back soon for stories from our adventures!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map(post => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group block bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {getFeaturedImage(post) ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={getFeaturedImage(post)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-primary/5 flex items-center justify-center">
                      <span className="text-4xl">🌿</span>
                    </div>
                  )}
                  <div className="p-5">
                    {post.metadata?.category && (
                      <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full mb-3">
                        {post.metadata.category}
                      </span>
                    )}
                    <h2 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{getExcerpt(post)}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.published_at || post.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getReadTime(post)}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Blog;
