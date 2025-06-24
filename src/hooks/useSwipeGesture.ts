import { useCallback, useState } from 'react';
import { PanInfo } from 'framer-motion';

interface SwipeGestureConfig {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  threshold?: number;
  velocityThreshold?: number;
  disabled?: boolean;
}

interface SwipeGestureReturn {
  isSwipeInProgress: boolean;
  handlePanStart: () => void;
  handlePanEnd: (event: any, info: PanInfo) => void;
  resetSwipeState: () => void;
}

/**
 * Custom hook for handling swipe gestures with proper state management
 * Provides clean separation between gesture detection and business logic
 */
export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  velocityThreshold = 0.15,
  disabled = false,
}: SwipeGestureConfig): SwipeGestureReturn => {
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);

  const handlePanStart = useCallback(() => {
    if (disabled) return;
    // Don't set swipe in progress here to allow drag feedback
  }, [disabled]);

  const handlePanEnd = useCallback(
    (event: any, info: PanInfo) => {
      if (disabled || isSwipeInProgress) return;

      const { offset, velocity } = info;
      const distance = Math.abs(offset.x);
      const speed = Math.abs(velocity.x);

      // Determine if this qualifies as a swipe
      const isSwipe = distance > threshold || speed > velocityThreshold;

      if (isSwipe) {
        setIsSwipeInProgress(true);

        // Determine swipe direction and execute callback
        if (offset.x > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }

        // Reset swipe state after a delay to prevent rapid consecutive swipes
        setTimeout(() => {
          setIsSwipeInProgress(false);
        }, 300);
      }
    },
    [disabled, isSwipeInProgress, threshold, velocityThreshold, onSwipeLeft, onSwipeRight]
  );

  const resetSwipeState = useCallback(() => {
    setIsSwipeInProgress(false);
  }, []);

  return {
    isSwipeInProgress,
    handlePanStart,
    handlePanEnd,
    resetSwipeState,
  };
};
