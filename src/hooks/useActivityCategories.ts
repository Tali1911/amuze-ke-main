import { useEffect, useState, useCallback } from 'react';
import {
  activityCategoryService,
  ActivityConfig,
} from '@/services/activityCategoryService';
import {
  setActivityCategoryCache,
  DEFAULT_ACTIVITY_CATEGORIES,
  DEFAULT_ACTIVITY_ALIASES,
} from '@/lib/activityCategories';

const DEFAULT_CONFIG: ActivityConfig = {
  categories: DEFAULT_ACTIVITY_CATEGORIES.map((label, i) => ({
    label,
    sort_order: (i + 1) * 10,
    is_active: true,
  })),
  aliases: DEFAULT_ACTIVITY_ALIASES,
};

const applyToCache = (cfg: ActivityConfig) => {
  const labels = [...cfg.categories]
    .filter(c => c.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(c => c.label);
  setActivityCategoryCache(labels, cfg.aliases || {});
};

/**
 * Loads activity categories + aliases from the DB and keeps the in-memory
 * cache in `lib/activityCategories.ts` synchronized so every consumer (forms,
 * filters, financial-report matcher) sees the latest config.
 */
export const useActivityCategories = () => {
  const [config, setConfig] = useState<ActivityConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let live = await activityCategoryService.fetch();
      if (!live) {
        // Seed on first run
        await activityCategoryService.upsert(DEFAULT_CONFIG);
        live = DEFAULT_CONFIG;
      }
      setConfig(live);
      applyToCache(live);
    } catch (err: any) {
      console.error('[useActivityCategories] load error:', err);
      setError(err?.message || 'Failed to load activity categories');
      // Fall back to defaults so the app still works
      applyToCache(DEFAULT_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Apply a freshly-saved config to both local state and global cache. */
  const apply = useCallback((next: ActivityConfig) => {
    setConfig(next);
    applyToCache(next);
  }, []);

  return {
    config,
    isLoading,
    error,
    refresh: load,
    apply,
  };
};
