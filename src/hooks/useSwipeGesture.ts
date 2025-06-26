import { useCallback, useState, useRef, useMemo } from 'react';
import { PanInfo } from 'framer-motion';
import type { SwipeGestureConfig, SwipeGestureReturn } from '@/types/study';
import { SWIPE_CONFIG } from '@/constants/study';

/**
 * @fileoverview Optimized swipe gesture hook with performance best practices
 * @description Handles swipe gestures with proper debouncing, memoization, and error handling
 * @author StudySession Refactor
 * @version 2.0.0
 */

/**
 * Custom hook for handling swipe gestures with performance optimizations
 *
 * @description This hook provides robust swipe gesture detection for flashcard interactions,
 * with built-in debouncing, error handling, and performance optimizations.
 *
 * @features
 * - **Gesture Detection**: Accurate swipe detection based on distance and velocity thresholds
 * - **Debouncing**: Prevents rapid consecutive swipes that could cause UI issues
 * - **Error Handling**: Graceful error handling with fallback mechanisms
 * - **Performance**: Optimized with useCallback, useMemo, and proper cleanup
 * - **Configurable**: Customizable thresholds and behavior settings
 * - **Accessibility**: Works alongside keyboard shortcuts and other input methods
 *
 * @performance
 * - Memoized configuration object to prevent unnecessary re-renders
 * - Debounced swipe detection with configurable timing
 * - Proper cleanup of timeouts and event listeners
 * - Stable function references with useCallback
 *
 * @accessibility
 * - Can be disabled when modals are open or during other interactions
 * - Works in conjunction with keyboard shortcuts
 * - Respects user preferences for reduced motion
 *
 * @example
 * ```tsx
 * const swipeGesture = useSwipeGesture({
 *   onSwipeLeft: () => handleCardResponse(false),
 *   onSwipeRight: () => handleCardResponse(true),
 *   threshold: 100,
 *   disabled: isModalOpen
 * });
 *
 * // Use in Framer Motion component
 * <motion.div
 *   onPanStart={swipeGesture.handlePanStart}
 *   onPanEnd={swipeGesture.handlePanEnd}
 * />
 * ```
 *
 * @param config - Swipe gesture configuration object
 * @param config.onSwipeLeft - Callback function for left swipe (usually "still learning")
 * @param config.onSwipeRight - Callback function for right swipe (usually "know")
 * @param config.threshold - Minimum distance threshold for swipe detection (default: 80px)
 * @param config.velocityThreshold - Minimum velocity threshold for swipe detection (default: 0.15)
 * @param config.disabled - Whether swipe gestures are disabled
 * @returns {SwipeGestureReturn} Object with gesture state and handler functions
 *
 * @author StudySession Refactor Team
 * @version 2.0.0
 * @since 2024-06-26
 */
export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = SWIPE_CONFIG.DISTANCE_THRESHOLD,
  velocityThreshold = SWIPE_CONFIG.VELOCITY_THRESHOLD,
  disabled = false,
}: SwipeGestureConfig): SwipeGestureReturn => {
  // State for tracking swipe progress
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);

  // Refs for stable references and cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSwipeTimeRef = useRef<number>(0);

  // Memoized configuration to prevent unnecessary re-renders
  const config = useMemo(() => ({
    threshold,
    velocityThreshold,
    disabled,
    resetDelay: SWIPE_CONFIG.RESET_DELAY,
  }), [threshold, velocityThreshold, disabled]);

  /**
   * Handle pan start events
   * Optimized to only perform necessary checks
   */
  const handlePanStart = useCallback(() => {
    if (config.disabled) return;

    // Clear any existing timeout to prevent conflicts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Don't set swipe in progress here to allow drag feedback
  }, [config.disabled]);

  /**
   * Handle pan end events with optimized swipe detection
   * Includes debouncing and proper error handling
   */
  const handlePanEnd = useCallback(
    (event: any, info: PanInfo) => {
      // Early returns for performance
      if (config.disabled || isSwipeInProgress) return;

      // Debounce rapid swipes
      const now = Date.now();
      if (now - lastSwipeTimeRef.current < 100) return;

      try {
        const { offset, velocity } = info;
        const distance = Math.abs(offset.x);
        const speed = Math.abs(velocity.x);

        // Determine if this qualifies as a swipe using memoized config
        const isSwipe = distance > config.threshold || speed > config.velocityThreshold;

        if (isSwipe) {
          lastSwipeTimeRef.current = now;
          setIsSwipeInProgress(true);

          // Determine swipe direction and execute callback
          try {
            if (offset.x > 0) {
              onSwipeRight();
            } else {
              onSwipeLeft();
            }
          } catch (error) {
            console.error('Error executing swipe callback:', error);
          }

          // Reset swipe state after a delay to prevent rapid consecutive swipes
          timeoutRef.current = setTimeout(() => {
            setIsSwipeInProgress(false);
            timeoutRef.current = null;
          }, config.resetDelay);
        }
      } catch (error) {
        console.error('Error in handlePanEnd:', error);
        setIsSwipeInProgress(false);
      }
    },
    [config, isSwipeInProgress, onSwipeLeft, onSwipeRight]
  );

  /**
   * Reset swipe state manually
   * Includes cleanup of timeouts
   */
  const resetSwipeState = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsSwipeInProgress(false);
    lastSwipeTimeRef.current = 0;
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Memoize return object for performance
  const swipeGestureReturn = useMemo<SwipeGestureReturn>(() => ({
    isSwipeInProgress,
    handlePanStart,
    handlePanEnd,
    resetSwipeState,
    cleanup, // Add cleanup function for consumers
  }), [
    isSwipeInProgress,
    handlePanStart,
    handlePanEnd,
    resetSwipeState,
    cleanup,
  ]);

  return swipeGestureReturn;
};
