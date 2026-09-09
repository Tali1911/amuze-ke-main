import { supabase } from '@/integrations/supabase/client';

// This uses the same ContentItem as cmsService for consistency
export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content?: string;
  content_type: 'page' | 'post' | 'announcement' | 'campaign' | 'hero_slide' | 'program' | 'site_settings' | 'testimonial' | 'team_member';
  status: 'draft' | 'published' | 'archived';
  author_id?: string;
  published_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface SectionConfig {
  id: string;
  name: string;
  component: string;
  order: number;
  isActive: boolean;
  layout?: string;
  settings?: Record<string, any>;
}

class ContentService {
  private static instance: ContentService;

  static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService();
    }
    return ContentService.instance;
  }

  async getContent(contentType?: string): Promise<ContentItem[]> {
    try {
      let query = (supabase as any).from('content_items').select('*');
      
      if (contentType) {
        query = query.eq('content_type', contentType);
      }
      
      const { data, error } = await query
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching content:', error);
      return [];
    }
  }

  async getContentByKey(contentType: string, slug: string): Promise<ContentItem | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('content_items')
        .select('*')
        .eq('content_type', contentType)
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching content by key:', error);
      return null;
    }
  }

  async saveContent(content: Partial<ContentItem>): Promise<ContentItem | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const contentData = {
        ...content,
        author_id: user?.id,
        published_at: content.status === 'published' ? new Date().toISOString() : null
      };

      const { data, error } = await (supabase as any)
        .from('content_items')
        .upsert([contentData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving content:', error);
      return null;
    }
  }

  async getSectionConfig(): Promise<SectionConfig[]> {
    // Return default sections (no database table for this yet)
    return this.getDefaultSections();
  }

  private getDefaultSections(): SectionConfig[] {
    return [
      { id: 'hero', name: 'Hero Section', component: 'Hero', order: 1, isActive: true },
      { id: 'announcements', name: 'Announcements', component: 'Announcements', order: 2, isActive: true },
      { id: 'about', name: 'About Us', component: 'AboutSection', order: 3, isActive: true },
      { id: 'programs', name: 'Programs', component: 'ProgramHighlights', order: 4, isActive: true },
      { id: 'calendar', name: 'Calendar', component: 'YearlyCalendar', order: 5, isActive: true },
      { id: 'team', name: 'Team', component: 'TeamSection', order: 6, isActive: true },
      { id: 'gallery', name: 'Gallery', component: 'Gallery', order: 7, isActive: true },
      { id: 'testimonials', name: 'Testimonials', component: 'Testimonials', order: 8, isActive: true },
      { id: 'contact', name: 'Contact', component: 'ContactForm', order: 9, isActive: true }
    ];
  }
}

export const contentService = ContentService.getInstance();
