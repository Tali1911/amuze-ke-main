import { useRef, useState, useCallback, useEffect, RefObject } from 'react';

interface UseDragScrollReturn {
  ref: RefObject<HTMLDivElement>;
  isDragging: boolean;
  handlers: {
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => void;
    onTouchMove: (e: React.TouchEvent<HTMLDivElement>) => void;
    onTouchEnd: () => void;
  };
}

export function useDragScroll(): UseDragScrollReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Don't drag if clicking interactive elements or selecting text inside inputs
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('[role="button"]') ||
      target.closest('[data-no-drag]') ||
      window.getSelection()?.toString()
    ) {
      return;
    }

    const container = ref.current;
    if (!container) return;

    setIsDragging(true);
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
    container.style.cursor = 'grabbing';
    container.style.userSelect = 'none';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = ref.current;
    if (!container || !isDragging) return;

    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * 1.2; // Slightly faster scroll feel
    container.scrollLeft = scrollLeftRef.current - walk;
    hasDraggedRef.current = true;
  }, [isDragging]);

  const stopDragging = useCallback(() => {
    const container = ref.current;
    if (!container) return;

    setIsDragging(false);
    container.style.cursor = 'grab';
    container.style.userSelect = '';

    // Slight delay so click handlers can see that a drag happened
    window.setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const container = ref.current;
    if (!container) return;

    startXRef.current = e.touches[0].pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
    hasDraggedRef.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const container = ref.current;
    if (!container) return;

    const x = e.touches[0].pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    container.scrollLeft = scrollLeftRef.current - walk;
    hasDraggedRef.current = true;
  }, []);

  const onTouchEnd = useCallback(() => {
    window.setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
  }, []);

  // Stop dragging if mouse leaves window
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) stopDragging();
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, stopDragging]);

  return {
    ref,
    isDragging,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp: stopDragging,
      onMouseLeave: stopDragging,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
