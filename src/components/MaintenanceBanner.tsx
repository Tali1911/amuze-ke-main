import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

const MaintenanceBanner: React.FC = () => {
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('system_settings')
          .select('key, value')
          .in('key', ['maintenance_mode', 'maintenance_message']);

        if (error || !data) return;

        const settings: Record<string, string> = {};
        (data as { key: string; value: string }[]).forEach(row => {
          settings[row.key] = row.value;
        });

        if (settings.maintenance_mode === 'true') {
          setActive(true);
          setMessage(settings.maintenance_message || 'We are currently performing scheduled maintenance. Please check back soon.');
        }
      } catch {
        // silently fail for public visitors
      }
    };
    fetchMaintenance();
  }, []);

  if (!active) return null;

  return (
    <div className="bg-amber-500/90 text-amber-950 px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default MaintenanceBanner;
