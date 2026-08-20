"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Toggles `.is-scrolling` so `.scrollbar-auto-hide` can reveal the thumb
 * while the user is scrolling (trackpad / keyboard), then hide it again.
 */
export function useAutoHideScrollbar(hideDelayMs = 700) {
  const [isScrolling, setIsScrolling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onScroll = useCallback(() => {
    setIsScrolling(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsScrolling(false), hideDelayMs);
  }, [hideDelayMs]);

  return {
    isScrolling,
    onScroll,
    className: isScrolling ? "is-scrolling" : "",
  };
}
