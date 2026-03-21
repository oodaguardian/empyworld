import { useEffect, useRef } from 'react';

/**
 * Custom hook for tap, swipe, and long-press gestures.
 * Attaches touch/pointer listeners to the given ref element.
 */
export default function useGesture(ref, { onTap, onSwipeLeft, onSwipeRight, onLongPress } = {}) {
  const state = useRef({ startX: 0, startY: 0, startTime: 0, longPressTimer: null });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const LONG_PRESS_MS = 600;
    const SWIPE_THRESHOLD = 50;

    function onPointerDown(e) {
      state.current.startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      state.current.startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      state.current.startTime = Date.now();

      if (onLongPress) {
        state.current.longPressTimer = setTimeout(() => {
          onLongPress(e);
        }, LONG_PRESS_MS);
      }
    }

    function onPointerUp(e) {
      clearTimeout(state.current.longPressTimer);

      const endX = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
      const endY = e.clientY ?? e.changedTouches?.[0]?.clientY ?? 0;
      const dx = endX - state.current.startX;
      const dy = endY - state.current.startY;
      const elapsed = Date.now() - state.current.startTime;

      // Swipe detection
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && onSwipeRight) onSwipeRight(e);
        else if (dx < 0 && onSwipeLeft) onSwipeLeft(e);
        return;
      }

      // Tap detection (short, small movement)
      if (elapsed < 300 && Math.abs(dx) < 10 && Math.abs(dy) < 10 && onTap) {
        onTap(e);
      }
    }

    function onPointerCancel() {
      clearTimeout(state.current.longPressTimer);
    }

    el.addEventListener('pointerdown', onPointerDown, { passive: true });
    el.addEventListener('pointerup', onPointerUp, { passive: true });
    el.addEventListener('pointercancel', onPointerCancel, { passive: true });
    el.addEventListener('touchstart', onPointerDown, { passive: true });
    el.addEventListener('touchend', onPointerUp, { passive: true });
    el.addEventListener('touchcancel', onPointerCancel, { passive: true });

    return () => {
      clearTimeout(state.current.longPressTimer);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerCancel);
      el.removeEventListener('touchstart', onPointerDown);
      el.removeEventListener('touchend', onPointerUp);
      el.removeEventListener('touchcancel', onPointerCancel);
    };
  }, [ref, onTap, onSwipeLeft, onSwipeRight, onLongPress]);
}
