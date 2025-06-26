import React, { memo, useMemo, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import FlashcardComponent from './FlashcardComponent';
import SwipeIndicator from './SwipeIndicator';
import type { Flashcard, CenterIndicatorState } from '@/types/study';
import { ANIMATION_DURATIONS, EASING, SWIPE_CONFIG } from '@/constants/study';

/**
 * @fileoverview Optimized SwipeableCard component with Framer Motion best practices
 * @description Enhanced swipeable card with performance optimizations and proper gesture handling
 * @author StudySession Refactor
 * @version 2.0.0
 */

interface SwipeableCardProps {
  card: Flashcard;
  isFlipped: boolean;
  isStarred: boolean;
  isSwipeInProgress: boolean;
  isSwipeDisabled?: boolean;
  onFlip: () => void;
  onStar: (cardId: string, isStarred: boolean) => void;
  onEdit?: (cardId: string) => void;
  onPanStart: () => void;
  onPanEnd: (event: any, info: PanInfo) => void;
  onModalStateChange?: (isModalOpen: boolean) => void;
  showCenterIndicator: CenterIndicatorState;
}

/**
 * Optimized SwipeableCard component with React.memo for performance
 * Prevents unnecessary re-renders and optimizes animation performance
 */
const SwipeableCard: React.FC<SwipeableCardProps> = memo(({
  card,
  isFlipped,
  isStarred,
  isSwipeInProgress,
  isSwipeDisabled = false,
  onFlip,
  onStar,
  onEdit,
  onPanStart,
  onPanEnd,
  onModalStateChange,
  showCenterIndicator,
}) => {
  // Memoized animation variants for performance optimization
  const animationVariants = useMemo(() => ({
    initial: {
      scale: 0.8,
      opacity: 0,
      y: 50
    },
    animate: {
      scale: 1,
      opacity: isSwipeInProgress ? 0.8 : 1,
      y: 0
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      y: -50,
      transition: { duration: ANIMATION_DURATIONS.CARD_EXIT / 1000 }
    },
    whileDrag: {
      scale: 1.05,
      rotate: 0,
      transition: { duration: 0.1 }
    }
  }), [isSwipeInProgress]);

  // Memoized transition settings
  const transitionSettings = useMemo(() => ({
    main: {
      duration: ANIMATION_DURATIONS.CARD_ENTRANCE / 1000,
      ...EASING.SPRING
    },
    inner: {
      ...EASING.SPRING,
      stiffness: 400,
      damping: 40
    },
    drag: {
      ...EASING.DRAG_TRANSITION
    }
  }), []);

  // Memoized drag constraints and settings
  const dragSettings = useMemo(() => ({
    drag: isSwipeDisabled ? false : "x" as const,
    dragConstraints: { left: 0, right: 0 },
    dragElastic: SWIPE_CONFIG.DRAG_ELASTIC,
    onPanStart: isSwipeDisabled ? undefined : onPanStart,
    onPanEnd: isSwipeDisabled ? undefined : onPanEnd,
  }), [isSwipeDisabled, onPanStart, onPanEnd]);

  // Memoized style object to prevent recreation
  const containerStyle = useMemo(() => ({
    touchAction: 'none' as const
  }), []);

  return (
    <motion.div
      key={card.id}
      className="w-full h-full touch-none relative z-20"
      style={containerStyle}
      initial={animationVariants.initial}
      animate={animationVariants.animate}
      exit={animationVariants.exit}
      transition={transitionSettings.main}
      whileDrag={animationVariants.whileDrag}
      dragTransition={transitionSettings.drag}
      {...dragSettings}
    >
      <motion.div
        className="w-full h-full"
        animate={{
          x: 0,
          rotate: 0
        }}
        transition={transitionSettings.inner}
      >
        <FlashcardComponent
          id={card.id}
          frontContent={card.front_content}
          backContent={card.back_content}
          frontContentHtml={card.front_content_html}
          backContentHtml={card.back_content_html}
          frontImageUrl={card.front_image_url}
          backImageUrl={card.back_image_url}
          isFlipped={isFlipped}
          onFlip={onFlip}
          onStar={onStar}
          onEdit={onEdit}
          isStarred={isStarred}
          className="w-full h-full"
          onModalStateChange={onModalStateChange}
        />

        {/* Center Indicator - positioned relative to the card */}
        <SwipeIndicator
          show={showCenterIndicator.show}
          type={showCenterIndicator.type}
        />
      </motion.div>
    </motion.div>
  );
});

// Display name for debugging
SwipeableCard.displayName = 'SwipeableCard';

export default SwipeableCard;
