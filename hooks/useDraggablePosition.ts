'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Position { x: number; y: number }

interface UseDraggablePositionOptions {
  storageKey?: string;
  defaultPosition?: Position;
}

function getDefaultPosition(): Position {
  if (typeof window === 'undefined') return { x: 900, y: 80 };
  return { x: Math.max(0, window.innerWidth - 280), y: 80 };
}

export function useDraggablePosition({
  storageKey,
  defaultPosition,
}: UseDraggablePositionOptions = {}) {
  const [position, setPosition] = useState<Position>(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved) as Position;
      } catch { /* ignore */ }
    }
    return defaultPosition ?? getDefaultPosition();
  });

  const isDragging = useRef(false);
  const startMousePos = useRef<Position>({ x: 0, y: 0 });
  const startWidgetPos = useRef<Position>({ x: 0, y: 0 });

  const clamp = useCallback((pos: Position, w: number, h: number): Position => ({
    x: Math.max(0, Math.min(window.innerWidth - w, pos.x)),
    y: Math.max(0, Math.min(window.innerHeight - h, pos.y)),
  }), []);

  const onDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const dx = clientX - startMousePos.current.x;
    const dy = clientY - startMousePos.current.y;
    const newPos = clamp(
      { x: startWidgetPos.current.x + dx, y: startWidgetPos.current.y + dy },
      240, 320
    );
    setPosition(newPos);
  }, [clamp]);

  const onDragEnd = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dx = clientX - startMousePos.current.x;
    const dy = clientY - startMousePos.current.y;
    const finalPos = clamp(
      { x: startWidgetPos.current.x + dx, y: startWidgetPos.current.y + dy },
      240, 320
    );
    setPosition(finalPos);
    if (storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify(finalPos)); } catch { /* ignore */ }
    }
  }, [clamp, storageKey]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => onDragMove(e.clientX, e.clientY);
    const onMouseUp   = (e: MouseEvent) => onDragEnd(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging.current) e.preventDefault();
      onDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd  = (e: TouchEvent) =>
      onDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);

    document.addEventListener('mousemove',  onMouseMove);
    document.addEventListener('mouseup',    onMouseUp);
    document.addEventListener('touchmove',  onTouchMove, { passive: false });
    document.addEventListener('touchend',   onTouchEnd);
    return () => {
      document.removeEventListener('mousemove',  onMouseMove);
      document.removeEventListener('mouseup',    onMouseUp);
      document.removeEventListener('touchmove',  onTouchMove);
      document.removeEventListener('touchend',   onTouchEnd);
    };
  }, [onDragMove, onDragEnd]);

  const dragHandleProps = {
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startMousePos.current  = { x: e.clientX, y: e.clientY };
      startWidgetPos.current = { ...position };
    },
    onTouchStart: (e: React.TouchEvent) => {
      isDragging.current = true;
      startMousePos.current  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startWidgetPos.current = { ...position };
    },
  };

  return { position, dragHandleProps };
}
