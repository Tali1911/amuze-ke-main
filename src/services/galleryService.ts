import { supabase } from '@/integrations/supabase/client';

export type GalleryCategory = 
  | 'all' 
  | 'camps' 
  | 'wildlife' 
  | 'team_building' 
  | 'parties' 
  | 'school_adventures' 
  | 'nature' 
  | 'activities';

export interface GalleryItem {
  id: string;
  storage_path: string;
  public_url: string;
  caption: string;
  category: GalleryCategory;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGalleryItemInput {
  storage_path: string;
  public_url: string;
  caption: string;
  category: GalleryCategory;
  is_featured?: boolean;
}

export interface UpdateGalleryItemInput {
  caption?: string;
  category?: GalleryCategory;
  display_order?: number;
  is_featured?: boolean;
}

export const GALLERY_CATEGORIES: { value: GalleryCategory; label: string }[] = [
  { value: 'all', label: 'All Photos' },
  { value: 'camps', label: 'Camps' },
  { value: 'wildlife', label: 'Wildlife' },
  { value: 'team_building', label: 'Team Building' },
  { value: 'parties', label: 'Parties' },
  { value: 'school_adventures', label: 'School Adventures' },
  { value: 'nature', label: 'Nature' },
  { value: 'activities', label: 'Activities' },
];

const PAGE_SIZE = 12;

// Helper to work with gallery_items table (not yet in generated types)
const getGalleryTable = () => {
  return (supabase as any).from('gallery_items');
};

export const galleryService = {
  /**
   * Fetch gallery items with optional category filter and pagination
   */
  async getItems(
    category: GalleryCategory = 'all',
    page: number = 1,
    pageSize: number = PAGE_SIZE
  ): Promise<{ items: GalleryItem[]; hasMore: boolean; total: number }> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = getGalleryTable()
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching gallery items:', error);
      throw error;
    }

    return {
      items: (data as GalleryItem[]) || [],
      hasMore: count ? from + pageSize < count : false,
      total: count || 0,
    };
  },

  /**
   * Get all items for admin management (no pagination)
   */
  async getAllItems(): Promise<GalleryItem[]> {
    const { data, error } = await getGalleryTable()
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all gallery items:', error);
      throw error;
    }

    return (data as GalleryItem[]) || [];
  },

  /**
   * Create a new gallery item
   */
  async createItem(input: CreateGalleryItemInput): Promise<GalleryItem> {
    const { data, error } = await getGalleryTable()
      .insert([input])
      .select()
      .single();

    if (error) {
      console.error('Error creating gallery item:', error);
      throw error;
    }

    return data as GalleryItem;
  },

  /**
   * Update an existing gallery item
   */
  async updateItem(id: string, input: UpdateGalleryItemInput): Promise<GalleryItem> {
    const { data, error } = await getGalleryTable()
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating gallery item:', error);
      throw error;
    }

    return data as GalleryItem;
  },

  /**
   * Delete a gallery item (also removes from storage)
   */
  async deleteItem(id: string, storagePath: string): Promise<void> {
    // First delete from storage
    const { error: storageError } = await supabase.storage
      .from('marketing-assets')
      .remove([storagePath]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue to delete metadata even if storage fails
    }

    // Then delete metadata
    const { error } = await getGalleryTable()
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting gallery item:', error);
      throw error;
    }
  },

  /**
   * Upload image and create gallery item
   */
  async uploadAndCreate(
    file: File,
    caption: string,
    category: GalleryCategory
  ): Promise<GalleryItem> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${caption.replace(/\s+/g, '-')}.${fileExt}`;
    const storagePath = `gallery-images/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('marketing-assets')
      .upload(storagePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('marketing-assets')
      .getPublicUrl(storagePath);

    // Create metadata record
    return this.createItem({
      storage_path: storagePath,
      public_url: publicUrl,
      caption,
      category,
    });
  },

  /**
   * Migrate existing images from storage to gallery_items table
   * Only run once during migration
   */
  async migrateExistingImages(): Promise<number> {
    try {
      // Get existing images from storage
      const { data: files, error } = await supabase.storage
        .from('marketing-assets')
        .list('gallery-images', {
          limit: 500,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const validFiles = files.filter(file => 
        !file.name.startsWith('.') && 
        file.name !== '.emptyFolderPlaceholder' &&
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name)
      );

      let migratedCount = 0;

      for (const file of validFiles) {
        const storagePath = `gallery-images/${file.name}`;
        
        // Check if already migrated
        const { data: existing } = await getGalleryTable()
          .select('id')
          .eq('storage_path', storagePath)
          .maybeSingle();

        if (existing) continue;

        const { data: { publicUrl } } = supabase.storage
          .from('marketing-assets')
          .getPublicUrl(storagePath);

        // Clean caption from filename
        let caption = file.name.replace(/\.[^/.]+$/, '');
        caption = caption.replace(/^\d{13}[_\s-]?/, '');
        caption = caption.replace(/[-_]/g, ' ').trim();

        await getGalleryTable().insert([{
          storage_path: storagePath,
          public_url: publicUrl,
          caption: caption || 'Gallery image',
          category: 'all',
        }]);

        migratedCount++;
      }

      return migratedCount;
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  }
};
