import { supabase } from '@/integrations/supabase/client';

// Temporarily ignore type errors until tables are created
const supabaseAny = supabase as any;

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  content?: string;
  content_type: 'page' | 'post' | 'announcement' | 'campaign' | 'hero_slide' | 'program' | 'site_settings' | 'testimonial' | 'team_member' | 'about_section' | 'service_item' | 'camp_page' | 'camp_form' | 'activity_detail' | 'experience_page';
  status: 'draft' | 'published' | 'archived';
  author_id?: string;
  published_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export const cmsService = {
  async createContent(contentData: {
    title: string;
    slug: string;
    content?: string;
    content_type: ContentItem['content_type'];
    status?: ContentItem['status'];
    metadata?: any;
  }): Promise<ContentItem | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }

      const { data, error } = await supabaseAny
        .from('content_items')
        .insert([{
          ...contentData,
          author_id: user?.id,
          status: contentData.status || 'draft',
          published_at: contentData.status === 'published' ? new Date().toISOString() : null
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating content:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return null;
      }
      
      console.log('Content created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error creating content:', error);
      return null;
    }
  },

  async getAllContent(contentType?: ContentItem['content_type']): Promise<ContentItem[]> {
    try {
      let query = supabaseAny
        .from('content_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching content:', error);
      return [];
    }
  },

  async getContentById(id: string): Promise<ContentItem | null> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error fetching content:', error);
      return null;
    }
  },

  async getContentBySlug(slug: string, contentType?: ContentItem['content_type']): Promise<ContentItem | null> {
    try {
      let query = supabaseAny
        .from('content_items')
        .select('*')
        .eq('slug', slug);
      
      if (contentType) {
        query = query.eq('content_type', contentType);
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Supabase error fetching by slug:', error);
        return null;
      }
      
      if (!data) {
        console.log('No content found for slug:', slug);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching content by slug:', error);
      return null;
    }
  },

  async updateContent(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    try {
      const updateData: any = { ...updates };
      
      // If publishing, set published_at
      if (updates.status === 'published' && !updates.published_at) {
        updateData.published_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAny
        .from('content_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error updating content:', error);
      return null;
    }
  },

  async deleteContent(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseAny
        .from('content_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error deleting content:', error);
      return false;
    }
  },

  async publishContent(id: string): Promise<ContentItem | null> {
    return this.updateContent(id, { 
      status: 'published',
      published_at: new Date().toISOString()
    });
  },

  async unpublishContent(id: string): Promise<ContentItem | null> {
    return this.updateContent(id, { status: 'draft' });
  },

  // Specialized methods for different content types
  async getHeroSlides(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'hero_slide')
        .eq('status', 'published')
        .order('metadata->order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching hero slides:', err);
      return [];
    }
  },

  async getPrograms(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'program')
        .eq('status', 'published')
        .order('metadata->order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching programs:', err);
      return [];
    }
  },

  async getPublishedAnnouncements(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'announcement')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching announcements:', err);
      return [];
    }
  },

  async getSiteSettings(): Promise<ContentItem | null> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'site_settings')
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching site settings:', err);
      return null;
    }
  },

  async getTestimonials(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'testimonial')
        .eq('status', 'published')
        .order('metadata->order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      return [];
    }
  },

  async getTeamMembers(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'team_member')
        .eq('status', 'published')
        .order('metadata->order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching team members:', err);
      return [];
    }
  },

  async getAboutSections(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'about_section')
        .eq('status', 'published')
        .order('metadata->order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching about sections:', err);
      return [];
    }
  },

  async getServiceItems(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'service_item')
        .eq('status', 'published')
        .order('metadata->order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching service items:', err);
      return [];
    }
  },

  // Camp Page Management
  async getCampPageConfig(campType: string): Promise<ContentItem | null> {
    try {
      const slug = `${campType}-page`;
      console.log(`[CMS] Fetching camp page config for slug: ${slug}`);
      
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'camp_page')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) {
        console.error(`[CMS] Error fetching ${slug}:`, error);
        throw error;
      }
      
      console.log(`[CMS] Query result for ${slug}:`, data);
      return data || null;
    } catch (err) {
      console.error('Error fetching camp page config:', err);
      return null;
    }
  },

  async getAllCampPages(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'camp_page')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching camp pages:', err);
      return [];
    }
  },

  async updateCampPageConfig(campType: string, config: any): Promise<ContentItem | null> {
    try {
      const slug = `${campType}-page`;
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use upsert for reliable save - this will insert or update based on slug + content_type
      const { data, error } = await supabaseAny
        .from('content_items')
        .upsert({
          slug,
          content_type: 'camp_page',
          title: `${campType.charAt(0).toUpperCase() + campType.slice(1)} Camp Page`,
          status: 'published',
          content: JSON.stringify(config),
          metadata: { pageConfig: config },
          author_id: user?.id,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'slug,content_type',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error updating camp page config:', err);
      return null;
    }
  },

  // Camp Form Management
  async getCampFormConfig(formType: string): Promise<ContentItem | null> {
    try {
      const slug = `${formType}-form`;
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'camp_form')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (err) {
      console.error('Error fetching camp form config:', err);
      return null;
    }
  },

  async getAllCampForms(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'camp_form')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching camp forms:', err);
      return [];
    }
  },

  async updateCampFormConfig(formType: string, config: any): Promise<ContentItem | null> {
    try {
      const slug = `${formType}-form`;
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use upsert for reliable save - this will insert or update based on slug + content_type
      const { data, error } = await supabaseAny
        .from('content_items')
        .upsert({
          slug,
          content_type: 'camp_form',
          title: `${formType.charAt(0).toUpperCase() + formType.slice(1)} Form Config`,
          status: 'published',
          content: JSON.stringify(config),
          metadata: { formConfig: config },
          author_id: user?.id,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'slug,content_type',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error updating camp form config:', err);
      return null;
    }
  },

  // Program Form Management
  async getProgramFormConfig(formType: string): Promise<ContentItem | null> {
    try {
      const slug = `${formType}-form`;
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'program_form')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (err) {
      console.error('Error fetching program form config:', err);
      return null;
    }
  },

  async getAllProgramForms(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'program_form')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching program forms:', err);
      return [];
    }
  },

  async updateProgramFormConfig(formType: string, config: any): Promise<ContentItem | null> {
    try {
      const slug = `${formType}-form`;
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabaseAny
        .from('content_items')
        .upsert({
          slug,
          content_type: 'program_form',
          title: `${formType.charAt(0).toUpperCase() + formType.slice(1)} Form Config`,
          status: 'published',
          content: JSON.stringify(config),
          metadata: { formConfig: config },
          author_id: user?.id,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'slug,content_type',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error updating program form config:', err);
      return null;
    }
  },

  // Activity Detail Management
  async getActivityDetail(slug: string): Promise<ContentItem | null> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'activity_detail')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (err) {
      console.error('Error fetching activity detail:', err);
      return null;
    }
  },

  async getAllActivityDetails(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'activity_detail')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching activity details:', err);
      return [];
    }
  },

  // Experience Page Management
  async getExperiencePageConfig(experienceType: string): Promise<ContentItem | null> {
    try {
      const slug = `${experienceType}-page`;
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'experience_page')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (error) {
        console.error(`[CMS] Error fetching ${slug}:`, error);
        throw error;
      }
      
      return data || null;
    } catch (err) {
      console.error('Error fetching experience page config:', err);
      return null;
    }
  },

  async getAllExperiencePages(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabaseAny
        .from('content_items')
        .select('*')
        .eq('content_type', 'experience_page')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching experience pages:', err);
      return [];
    }
  },

  async updateExperiencePageConfig(experienceType: string, config: any): Promise<ContentItem | null> {
    try {
      const slug = `${experienceType}-page`;
      const { data: { user } } = await supabase.auth.getUser();
      
      // Extract pageConfig if passed nested, otherwise use config directly
      const pageConfig = config.pageConfig || config;
      
      // Build metadata object - include any additional config properties (like mediaUrl, mediaType)
      const metadata: any = { pageConfig };
      if (config.mediaUrl) metadata.mediaUrl = config.mediaUrl;
      if (config.mediaType) metadata.mediaType = config.mediaType;
      if (config.videoThumbnail) metadata.videoThumbnail = config.videoThumbnail;
      
      const { data, error } = await supabaseAny
        .from('content_items')
        .upsert({
          slug,
          content_type: 'experience_page',
          title: `${experienceType.charAt(0).toUpperCase() + experienceType.slice(1).replace(/-/g, ' ')} Page`,
          status: 'published',
          content: JSON.stringify(pageConfig),
          metadata,
          author_id: user?.id,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'slug,content_type',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error updating experience page config:', err);
      return null;
    }
  }
};
