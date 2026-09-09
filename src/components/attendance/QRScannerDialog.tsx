import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, type Html5QrcodeCameraScanConfig } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface QRScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (qrCodeData: string) => void;
}

type ScanMode = 'camera' | 'upload';
const LS_MODE = 'qrScan.mode';
const LS_CAMERA = 'qrScan.cameraId';
const READER_ID = 'qr-reader-live';

const getErrorDetails = (err: unknown) => {
  const maybeError = err as { name?: string; message?: string } | undefined;
  const name = maybeError?.name || '';
  const message = maybeError?.message || String(err || '');
  const details = [name, message].filter(Boolean).join(': ');
  return { name, message, details };
};

const isPolicyBlocked = (message: string) =>
  /permissions policy|permission policy|feature policy|not allowed by the user agent|disallowed by permissions/i.test(message);

const setStoredValue = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
};

const removeStoredValue = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    return;
  }
};

const cameraAllowedByFramePolicy = () => {
  const doc = document as Document & {
    featurePolicy?: { allowsFeature?: (feature: string) => boolean };
    permissionsPolicy?: { allowsFeature?: (feature: string) => boolean };
  };

  try {
    if (doc.permissionsPolicy?.allowsFeature) return doc.permissionsPolicy.allowsFeature('camera');
    if (doc.featurePolicy?.allowsFeature) return doc.featurePolicy.allowsFeature('camera');
  } catch {
    return true;
  }

  return true;
};

export const QRScannerDialog = ({ open, onClose, onScanSuccess }: QRScannerDialogProps) => {
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const startedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<ScanMode>(
    () => (typeof window !== 'undefined' && (localStorage.getItem(LS_MODE) as ScanMode)) || 'camera',
  );
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(
    () => (typeof window !== 'undefined' && localStorage.getItem(LS_CAMERA)) || null,
  );
  const [status, setStatus] = useState<'idle' | 'starting' | 'running' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const stopScanner = useCallback(async () => {
    const instance = html5QrRef.current;
    if (!instance) return;
    try {
      if (startedRef.current) {
        await instance.stop();
      }
      await instance.clear();
    } catch (e) {
      // ignore - already stopped
    } finally {
      startedRef.current = false;
      html5QrRef.current = null;
    }
  }, []);

  const handleDecoded = useCallback(
    async (text: string) => {
      await stopScanner();
      onScanSuccess(text);
    },
    [onScanSuccess, stopScanner],
  );

  const startCamera = useCallback(
    async (cameraId?: string | null) => {
      setStatus('starting');
      setErrorMsg('');

      // Ensure DOM target exists
      let tries = 0;
      while (!document.getElementById(READER_ID) && tries < 20) {
        await new Promise((r) => setTimeout(r, 50));
        tries++;
      }
      const el = document.getElementById(READER_ID);
      if (!el) {
        setStatus('error');
        setErrorMsg('Scanner container not ready. Please try again.');
        return;
      }

      // Tear down any previous instance
      await stopScanner();

      const instance = new Html5Qrcode(READER_ID, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrRef.current = instance;

      const config: Html5QrcodeCameraScanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      };

      const startWithSource = async (source: MediaTrackConstraints | string) => {
        await instance.start(
          source,
          config,
          (decodedText) => {
            void handleDecoded(decodedText);
          },
          () => {
            // per-frame errors ignored
          },
        );
      };

      const applyCameraList = async (preferredId?: string | null) => {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || !devices.length) return [];

        setCameras(devices.map((d) => ({ id: d.id, label: d.label || 'Camera' })));
        const selected = preferredId
          ? devices.find((d) => d.id === preferredId)
          : devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[devices.length - 1];

        if (selected) {
          setActiveCameraId(selected.id);
          setStoredValue(LS_CAMERA, selected.id);
        }

        return devices;
      };

      try {
        if (!cameraAllowedByFramePolicy()) {
          throw new Error('Camera access is blocked by the browser permissions policy for this page.');
        }

        await startWithSource(cameraId || ({ facingMode: 'environment' } as MediaTrackConstraints));
        startedRef.current = true;
        setStatus('running');

        // Populate camera list (after permission is granted device labels become available)
        try {
          await applyCameraList(cameraId);
        } catch {
          // ignore - enumeration is best-effort
        }
      } catch (err: unknown) {
        let cameraError: unknown = err;
        const firstError = getErrorDetails(cameraError);
        console.error('QR scanner camera start failed', cameraError);
        removeStoredValue(LS_CAMERA);

        if (!cameraId && !isPolicyBlocked(firstError.message)) {
          try {
            const devices = await applyCameraList(null);
            const fallback =
              devices.find((d) => /back|rear|environment/i.test(d.label)) || devices[devices.length - 1] || devices[0];

            if (fallback?.id) {
              await startWithSource(fallback.id);
              startedRef.current = true;
              setActiveCameraId(fallback.id);
              setStoredValue(LS_CAMERA, fallback.id);
              setStatus('running');
              return;
            }
          } catch (retryErr) {
            console.error('QR scanner fallback camera start failed', retryErr);
            cameraError = retryErr;
          }
        }

        startedRef.current = false;
        html5QrRef.current = null;
        setStatus('error');
        const { name, message, details } = getErrorDetails(cameraError);
        const extra = details ? ` (${details})` : '';
        if (isPolicyBlocked(message)) {
          setErrorMsg(`Camera access is blocked in this preview or browser. Open the published site, use Safari/Chrome directly, or upload an image instead.${extra}`);
        } else if (name === 'NotAllowedError' || /permission|denied|notallowed/i.test(message)) {
          setErrorMsg(`Camera blocked. Enable camera access in your browser settings, then try again.${extra}`);
        } else if (name === 'NotFoundError' || /no camera|requested device not found|notfound/i.test(message)) {
          setErrorMsg(`No camera found. Upload an image of the QR code instead.${extra}`);
          setMode('upload');
          setStoredValue(LS_MODE, 'upload');
        } else if (name === 'NotReadableError') {
          setErrorMsg(`Camera is in use by another app. Close it and try again.${extra}`);
        } else {
          setErrorMsg(`Could not start the camera. Upload an image instead or try a different browser.${extra}`);
        }
      }
    },
    [handleDecoded, stopScanner],
  );

  // Open / close lifecycle
  useEffect(() => {
    if (!open) {
      void stopScanner();
      setStatus('idle');
      setErrorMsg('');
      return;
    }
    if (mode === 'camera') {
      void startCamera(activeCameraId);
    }
    return () => {
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const switchToUpload = async () => {
    await stopScanner();
    setMode('upload');
    setErrorMsg('');
    setStatus('idle');
    setStoredValue(LS_MODE, 'upload');
  };

  const switchToCamera = async () => {
    setMode('camera');
    setStoredValue(LS_MODE, 'camera');
    await startCamera(activeCameraId);
  };

  const changeCamera = async (id: string) => {
    setActiveCameraId(id);
    setStoredValue(LS_CAMERA, id);
    await startCamera(id);
  };

  const handleFile = async (file: File) => {
    setErrorMsg('');
    setStatus('starting');
    await stopScanner();
    const instance = new Html5Qrcode(READER_ID, { verbose: false });
    html5QrRef.current = instance;
    try {
      const result = await instance.scanFile(file, false);
      void handleDecoded(result);
    } catch {
      setStatus('error');
      setErrorMsg('Could not read a QR code from that image. Try another photo.');
    } finally {
      try {
        await instance.clear();
      } catch (clearErr) {
        console.warn('QR scanner image reader cleanup failed', clearErr);
      }
      html5QrRef.current = null;
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) void handleClose(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <DialogTitle>Scan QR Code</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-6 w-6 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            {mode === 'camera'
              ? 'Point your camera at the registration QR code.'
              : 'Upload a photo or screenshot of the QR code.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Live scanner container — kept mounted so html5-qrcode always has its target */}
          <div className="relative">
            <div
              id={READER_ID}
              className={
                mode === 'camera'
                  ? 'rounded-lg overflow-hidden border border-border min-h-[260px] bg-muted'
                  : 'hidden'
              }
            />
            {mode === 'camera' && status === 'starting' && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm">Starting camera…</span>
              </div>
            )}
          </div>

          {/* Upload mode */}
          {mode === 'upload' && (
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-3">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Select an image containing the QR code</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                  e.target.value = '';
                }}
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                Choose image
              </Button>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {errorMsg}
            </div>
          )}

          {/* Footer controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
            {mode === 'camera' ? (
              <>
                {cameras.length > 1 ? (
                  <Select value={activeCameraId ?? undefined} onValueChange={changeCamera}>
                    <SelectTrigger className="h-8 w-[200px] text-xs">
                      <SelectValue placeholder="Camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {cameras.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {status === 'running' ? 'Camera ready' : ''}
                  </span>
                )}
                <Button variant="link" size="sm" className="text-xs" onClick={switchToUpload}>
                  <Upload className="h-3 w-3 mr-1" /> Upload image instead
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">Upload mode</span>
                <Button variant="link" size="sm" className="text-xs" onClick={switchToCamera}>
                  <Camera className="h-3 w-3 mr-1" /> Use camera instead
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
