import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import type { RegistrationLoadProgress } from '@/hooks/useRegistrationLoadProgress';

export function RegistrationLoadStatus({ progress }: { progress: RegistrationLoadProgress }) {
  const { loaded, status } = progress;
  const Icon = status === 'complete' ? CheckCircle : status === 'error' ? AlertCircle : Loader2;
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="flex items-start gap-2 text-sm text-muted-foreground">
      <Icon aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${status === 'loading' ? 'motion-safe:animate-spin' : ''} ${status === 'complete' ? 'text-primary' : ''}`} />
      <div className="min-w-0">
        <span className="font-medium text-foreground">{loaded.toLocaleString()} registrations loaded</span>
        <span className="block text-xs sm:inline sm:ml-2">
          {status === 'complete'
            ? 'Complete — totals and filters are up to date.'
            : status === 'error'
              ? 'Loading incomplete — totals and filters may be partial. Retry to finish.'
              : 'Loading more records — totals and filters are partial until complete.'}
        </span>
      </div>
    </div>
  );
}