import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SystemSettingsMap = Record<string, string>;

let cache: SystemSettingsMap | null = null;
let inflight: Promise<SystemSettingsMap> | null = null;
const listeners = new Set<(s: SystemSettingsMap) => void>();

async function fetchSettings(): Promise<SystemSettingsMap> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('system_settings')
        .select('key, value');
      if (error) throw error;
      const map: SystemSettingsMap = {};
      (data as { key: string; value: string }[] | null)?.forEach(r => {
        map[r.key] = r.value;
      });
      cache = map;
      listeners.forEach(l => l(map));
      return map;
    } catch (e) {
      console.warn('[useSystemSettings] failed to load:', e);
      cache = {};
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function invalidateSystemSettings() {
  cache = null;
  fetchSettings().then(m => listeners.forEach(l => l(m)));
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettingsMap | null>(cache);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let mounted = true;
    const listener = (s: SystemSettingsMap) => {
      if (mounted) setSettings({ ...s });
    };
    listeners.add(listener);
    fetchSettings().then(s => {
      if (!mounted) return;
      setSettings({ ...s });
      setLoading(false);
    });
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return { settings: settings || {}, loading };
}

export function useSystemSetting(key: string, fallback = ''): string {
  const { settings } = useSystemSettings();
  return settings[key] ?? fallback;
}
