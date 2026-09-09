import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import { cmsService, ContentItem } from '@/services/cmsService';
import { sanitizeHtml } from '@/utils/sanitize';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) loadPost(slug);
  }, [slug]);

  const loadPost = async (s: string) => {
    setIsLoading(true);
    const data = await cmsService.getContentBySlug(s, 'post');
    setPost(data);
    setIsLoading(false);
  };

  const getReadTime = () => {
    if (!post?.content) return '1 min read';
    const words = post.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return `${Math.max(1, Math.ceil(words / 200))} min read`;
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16 max-w-3xl">
            <div className="animate-pulse space-y-4">
              <div className="bg-muted h-8 rounded w-1/2" />
              <div className="bg-muted h-4 rounded w-1/3" />
              <div className="bg-muted rounded-xl h-64 mt-6" />
              <div className="space-y-2 mt-6">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="bg-muted h-4 rounded" />)}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">The blog post you're looking for doesn't exist.</p>
            <Link to="/blog" className="text-primary hover:underline font-medium flex items-center gap-2 justify-center">
              <ArrowLeft className="h-4 w-4" /> Back to Blog
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.metadata?.excerpt || post.content?.replace(/<[^>]*>/g, '').substring(0, 160),
    "image": post.metadata?.featured_image || "https://amusekenya.co.ke/og-image.png",
    "datePublished": post.published_at || post.created_at,
    "dateModified": post.updated_at,
    "author": { "@type": "Organization", "name": post.metadata?.author || "Amuse Kenya" },
    "publisher": {
      "@type": "Organization",
      "name": "Amuse Kenya",
      "logo": { "@type": "ImageObject", "url": "https://amusekenya.co.ke/og-image.png" }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": `https://amusekenya.co.ke/blog/${post.slug}` }
  };

  const excerpt = post.metadata?.excerpt || post.content?.replace(/<[^>]*>/g, '').substring(0, 160) || '';

  return (
    <>
      <SEOHead
        title={`${post.title} - Amuse Kenya Blog`}
        description={excerpt}
        keywords={post.metadata?.tags?.join(', ') || 'Amuse Kenya, blog, outdoor education'}
        canonical={`https://amusekenya.co.ke/blog/${post.slug}`}
        ogType="article"
        ogImage={post.metadata?.featured_image || '/og-image.png'}
        structuredData={structuredData}
      />
      <Navbar />
      <main className="min-h-screen bg-background">
        <article className="container mx-auto px-4 py-12 max-w-3xl">
          <Link to="/blog" className="text-primary hover:underline font-medium flex items-center gap-2 mb-8 text-sm">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          {post.metadata?.category && (
            <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full mb-4">
              {post.metadata.category}
            </span>
          )}

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{post.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            {post.metadata?.author && (
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {post.metadata.author}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.published_at || post.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {getReadTime()}
            </span>
          </div>

          {post.metadata?.featured_image && (
            <div className="rounded-xl overflow-hidden mb-8">
              <img
                src={post.metadata.featured_image}
                alt={post.title}
                className="w-full h-auto object-cover max-h-[500px]"
              />
            </div>
          )}

          <div
            className="prose prose-gray max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || '') }}
          />

          {post.metadata?.tags && post.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-border">
              {post.metadata.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
};

export default BlogPost;
