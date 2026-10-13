import { useCallback, useRef, useState } from 'react';

export type RegistrationLoadProgress = {
  loaded: number;
  status: 'loading' | 'complete' | 'error';
};

/** A newer filter/date request owns the indicator; older responses cannot finish it. */
export function useRegistrationLoadProgress() {
  const [progress, setProgress] = useState<RegistrationLoadProgress>({ loaded: 0, status: 'loading' });
  const generation = useRef(0);
  const begin = useCallback(() => {
    const request = ++generation.current;
    const isCurrent = () => generation.current === request;
    setProgress({ loaded: 0, status: 'loading' });
    return {
      isCurrent,
      update: (loaded: number) => {
        if (isCurrent()) setProgress({ loaded, status: 'loading' });
      },
      complete: (loaded: number) => {
        if (isCurrent()) setProgress({ loaded, status: 'complete' });
      },
      fail: () => {
        if (isCurrent()) setProgress(previous => ({ ...previous, status: 'error' }));
      },
    };
  }, []);
  return { progress, begin };
}