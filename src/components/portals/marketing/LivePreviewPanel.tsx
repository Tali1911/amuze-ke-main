import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ExternalLink, Monitor, Tablet, Smartphone, Loader2 } from 'lucide-react';

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTH: Record<Device, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 390,
};

// Wait this long after the last CMS edit before refreshing the iframe. Keeps
// rapid typing / slider drags from thrashing the preview.
const REFRESH_DEBOUNCE_MS = 600;

interface Props {
  /** Path on the public site to preview. Defaults to homepage. */
  path?: string;
  title?: string;
  description?: string;
}

/**
 * Embedded live preview of the public site. Debounces CMS-update events so
 * rapid edits coalesce into a single refresh, and shows a loading overlay
 * while the iframe is reloading.
 */
const LivePreviewPanel: React.FC<Props> = ({
  path = '/',
  title = 'Live Public-Site Preview',
  description = 'See how the public site looks right now. Refreshes automatically after CMS saves.',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<Device>('desktop');
  const [nonce, setNonce] = useState(0);
  const [pendingRefresh, setPendingRefresh] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<number | null>(null);

  const triggerRefresh = () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setPendingRefresh(false);
    setIsLoading(true);
    setNonce(n => n + 1);
  };

  const scheduleRefresh = () => {
    setPendingRefresh(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      triggerRefresh();
    }, REFRESH_DEBOUNCE_MS);
  };

  useEffect(() => {
    window.addEventListener('cms-content-updated', scheduleRefresh);
    return () => {
      window.removeEventListener('cms-content-updated', scheduleRefresh);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  const src = `${path}${path.includes('?') ? '&' : '?'}_cms_preview=${nonce}`;
  const width = DEVICE_WIDTH[device];

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            {title}
            {(isLoading || pendingRefresh) && (
              <span
                className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground"
                aria-live="polite"
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                {pendingRefresh ? 'Queuing refresh…' : 'Refreshing…'}
              </span>
            )}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={device === 'desktop' ? 'secondary' : 'ghost'}
              onClick={() => setDevice('desktop')}
              aria-label="Desktop preview"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={device === 'tablet' ? 'secondary' : 'ghost'}
              onClick={() => setDevice('tablet')}
              aria-label="Tablet preview"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={device === 'mobile' ? 'secondary' : 'ghost'}
              onClick={() => setDevice('mobile')}
              aria-label="Mobile preview"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={triggerRefresh} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            {isLoading ? 'Refreshing' : 'Refresh'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              // Lazy import to keep this file dependency-light
              import('@/lib/publicUrl').then(({ publicUrl }) => {
                window.open(publicUrl(path), '_blank', 'noopener,noreferrer');
              });
            }}
          >
            <ExternalLink className="h-4 w-4 mr-1" /> Open
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto rounded-md border bg-muted/30 p-2">
          <div
            className="mx-auto bg-background shadow-sm transition-all relative"
            style={{ width, maxWidth: '100%' }}
          >
            {isLoading && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-sm"
                role="status"
                aria-label="Preview refreshing"
              >
                <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Refreshing preview…</span>
                </div>
              </div>
            )}
            <iframe
              key={nonce}
              ref={iframeRef}
              src={src}
              title="Public site preview"
              className="w-full"
              style={{ height: '70vh', border: 0 }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Tip: rapid edits are batched — the preview refreshes shortly after you stop typing. Use Refresh
          to reload immediately.
        </p>
      </CardContent>
    </Card>
  );
};

export default LivePreviewPanel;
