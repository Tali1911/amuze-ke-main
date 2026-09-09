import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { cmsService, ContentItem } from '@/services/cmsService';
import CreativeBlogEditor from './CreativeBlogEditor';
import MediaUploader from './MediaUploader';

interface BlogPostEditorProps {
  isOpen: boolean;
  onClose: () => void;
  post?: ContentItem | null;
  onSave: () => void;
}

export const BlogPostEditor: React.FC<BlogPostEditorProps> = ({ isOpen, onClose, post, onSave }) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setSlug(post.slug || '');
      setContent(post.content || '');
      setExcerpt(post.metadata?.excerpt || '');
      setCategory(post.metadata?.category || '');
      setAuthor(post.metadata?.author || '');
      setFeaturedImage(post.metadata?.featured_image || '');
      setTags(post.metadata?.tags?.join(', ') || '');
      setStatus(post.status === 'published' ? 'published' : 'draft');
      setSeoTitle(post.metadata?.seo_title || '');
      setSeoDescription(post.metadata?.seo_description || '');
    } else {
      setTitle('');
      setSlug('');
      setContent('');
      setExcerpt('');
      setCategory('');
      setAuthor('Amuse Kenya');
      setFeaturedImage('');
      setTags('');
      setStatus('draft');
      setSeoTitle('');
      setSeoDescription('');
    }
  }, [post, isOpen]);

  const generateSlug = (t: string) => {
    return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!post) setSlug(generateSlug(val));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setIsSaving(true);

    const metadata = {
      excerpt,
      category,
      author,
      featured_image: featuredImage,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      seo_title: seoTitle,
      seo_description: seoDescription,
    };

    try {
      if (post) {
        await cmsService.updateContent(post.id, {
          title,
          slug: slug || generateSlug(title),
          content,
          status,
          metadata,
        });
      } else {
        await cmsService.createContent({
          title,
          slug: slug || generateSlug(title),
          content,
          content_type: 'post',
          status,
          metadata,
        });
      }
      toast({ title: `Blog post ${post ? 'updated' : 'created'} successfully` });
      onSave();
    } catch (err) {
      toast({ title: 'Error saving post', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Blog Post' : 'New Blog Post'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Blog post title" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto-generated-from-title" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Adventures, Tips" />
              </div>
              <div className="space-y-2">
                <Label>Author</Label>
                <Input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: 'draft' | 'published') => setStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short description for previews (max 160 chars)" rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <CreativeBlogEditor value={content} onChange={setContent} height={500} />
            </div>

            <div className="space-y-2">
              <Label>Tags (comma separated)</Label>
              <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="nature, adventure, kids" />
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <div className="space-y-2">
              <Label>Featured Image</Label>
              {featuredImage && (
                <img src={featuredImage} alt="Featured" className="w-full max-h-48 object-cover rounded-lg mb-2" />
              )}
              <MediaUploader
                mediaType="photo"
                mediaUrl={featuredImage}
                onMediaTypeChange={() => {}}
                onMediaUrlChange={(url) => setFeaturedImage(url)}
                storagePath="blog"
              />
              <Input value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} placeholder="Or paste image URL" className="mt-2" />
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <div className="space-y-2">
              <Label>SEO Title (max 60 chars)</Label>
              <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={title || 'SEO title'} maxLength={60} />
              <p className="text-xs text-muted-foreground">{seoTitle.length}/60</p>
            </div>
            <div className="space-y-2">
              <Label>Meta Description (max 160 chars)</Label>
              <Textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder={excerpt || 'Meta description'} rows={2} maxLength={160} />
              <p className="text-xs text-muted-foreground">{seoDescription.length}/160</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
