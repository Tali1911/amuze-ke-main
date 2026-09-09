import { supabase } from '@/integrations/supabase/client';

/**
 * Activity Categories config — stored as a single row in `content_items`
 * with slug = 'activity-categories'. The metadata column holds:
 *   {
 *     categories: [{ label, sort_order, is_active }, ...],
 *     aliases:    { "<category-label-lower>": ["alias1", "alias2", ...], ... }
 *   }
 *
 * Reads are public (RLS allows reading published content); writes require
 * an authenticated user with the appropriate role (admin/accounts).
 */

export interface ActivityCategory {
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface ActivityConfig {
  categories: ActivityCategory[];
  aliases: Record<string, string[]>;
}

const SLUG = 'activity-categories';

const fromContent = () => (supabase as any).from('content_items');

const normalizeKey = (label: string) =>
  label.toLowerCase().replace(/\s+/g, ' ').trim();

export const activityCategoryService = {
  /** Fetch the singleton config row. Returns null if not yet seeded. */
  async fetch(): Promise<ActivityConfig | null> {
    const { data, error } = await fromContent()
      .select('id, metadata')
      .eq('slug', SLUG)
      .maybeSingle();

    if (error) {
      console.error('[activityCategoryService] fetch error:', error);
      return null;
    }
    if (!data) return null;
    const meta = (data.metadata || {}) as any;
    return {
      categories: Array.isArray(meta.categories) ? meta.categories : [],
      aliases: meta.aliases && typeof meta.aliases === 'object' ? meta.aliases : {},
    };
  },

  /** Create the config row if it doesn't exist yet — used to seed defaults. */
  async upsert(config: ActivityConfig): Promise<void> {
    // Look up existing row id
    const { data: existing } = await fromContent()
      .select('id')
      .eq('slug', SLUG)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await fromContent()
        .update({
          metadata: config as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) throw error;
      return;
    }

    const { error } = await fromContent().insert({
      slug: SLUG,
      title: 'Activity Categories Configuration',
      content_type: 'config',
      status: 'published',
      metadata: config as any,
    });
    if (error) throw error;
  },

  // ---- Category mutations (operate on local copy then upsert) ----

  async addCategory(current: ActivityConfig, label: string): Promise<ActivityConfig> {
    const trimmed = label.trim();
    if (!trimmed) throw new Error('Category label cannot be empty');
    if (current.categories.some(c => normalizeKey(c.label) === normalizeKey(trimmed))) {
      throw new Error('A category with that label already exists');
    }
    const next: ActivityConfig = {
      categories: [
        ...current.categories,
        { label: trimmed, sort_order: current.categories.length * 10 + 10, is_active: true },
      ],
      aliases: { ...current.aliases, [normalizeKey(trimmed)]: [] },
    };
    await this.upsert(next);
    return next;
  },

  async updateCategory(
    current: ActivityConfig,
    oldLabel: string,
    patch: Partial<ActivityCategory>,
  ): Promise<ActivityConfig> {
    const oldKey = normalizeKey(oldLabel);
    const newLabel = patch.label?.trim() || oldLabel;
    const newKey = normalizeKey(newLabel);

    if (newKey !== oldKey && current.categories.some(c => normalizeKey(c.label) === newKey)) {
      throw new Error('Another category already uses that label');
    }

    const next: ActivityConfig = {
      categories: current.categories.map(c =>
        normalizeKey(c.label) === oldKey ? { ...c, ...patch, label: newLabel } : c,
      ),
      aliases: { ...current.aliases },
    };
    if (newKey !== oldKey) {
      next.aliases[newKey] = next.aliases[oldKey] || [];
      delete next.aliases[oldKey];
    }
    await this.upsert(next);
    return next;
  },

  async deleteCategory(current: ActivityConfig, label: string): Promise<ActivityConfig> {
    const key = normalizeKey(label);
    const next: ActivityConfig = {
      categories: current.categories.filter(c => normalizeKey(c.label) !== key),
      aliases: { ...current.aliases },
    };
    delete next.aliases[key];
    await this.upsert(next);
    return next;
  },

  async addAlias(current: ActivityConfig, label: string, alias: string): Promise<ActivityConfig> {
    const trimmed = alias.trim().toLowerCase();
    if (!trimmed) throw new Error('Alias cannot be empty');
    const key = normalizeKey(label);
    const list = current.aliases[key] || [];
    if (list.includes(trimmed)) throw new Error('Alias already exists for this category');
    const next: ActivityConfig = {
      categories: current.categories,
      aliases: { ...current.aliases, [key]: [...list, trimmed] },
    };
    await this.upsert(next);
    return next;
  },

  async removeAlias(current: ActivityConfig, label: string, alias: string): Promise<ActivityConfig> {
    const key = normalizeKey(label);
    const list = current.aliases[key] || [];
    const next: ActivityConfig = {
      categories: current.categories,
      aliases: { ...current.aliases, [key]: list.filter(a => a !== alias) },
    };
    await this.upsert(next);
    return next;
  },

  /** Discover camp_type values that exist in the DB but are not mapped yet. */
  async discoverUnmappedAliases(current: ActivityConfig): Promise<string[]> {
    const { data, error } = await (supabase as any)
      .from('camp_registrations')
      .select('camp_type')
      .not('camp_type', 'is', null);
    if (error) {
      console.error('[activityCategoryService] discover error:', error);
      return [];
    }
    const known = new Set<string>();
    Object.values(current.aliases).forEach(list =>
      (list || []).forEach(a => known.add(a.toLowerCase())),
    );
    current.categories.forEach(c => known.add(normalizeKey(c.label)));

    const seen = new Set<string>();
    ((data || []) as Array<{ camp_type: string | null }>).forEach(r => {
      const v = (r.camp_type || '').trim().toLowerCase();
      if (v && !known.has(v)) seen.add(v);
    });
    return Array.from(seen).sort();
  },
};
