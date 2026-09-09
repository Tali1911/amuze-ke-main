import { CheckCircle2 } from 'lucide-react';

const AutoFilledBadge = () => (
  <span className="inline-flex items-center gap-1 text-xs text-primary font-medium ml-2">
    <CheckCircle2 className="w-3 h-3" />
    Auto-filled
  </span>
);

export default AutoFilledBadge;
