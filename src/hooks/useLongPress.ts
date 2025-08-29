import { useCallback, useRef } from 'react';
import type { TouchEvent } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  delay?: number;
}

export const useLongPress = ({ onLongPress, onClick, delay = 500 }: UseLongPressOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const clickHandler = useCallback(() => {
    if (!isLongPressRef.current && onClick) {
      onClick();
    }
  }, [onClick]);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: (e: TouchEvent) => {
      e.preventDefault(); // Prevent default touch behavior
      start();
    },
    onTouchEnd: clear,
    onTouchCancel: clear,
    onTouchMove: clear, // Cancel long press if user moves finger
    onClick: clickHandler,
  };
};
