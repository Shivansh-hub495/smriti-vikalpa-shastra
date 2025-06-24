import React from 'react';
import { motion, PanInfo } from 'framer-motion';
import FlashcardComponent from './FlashcardComponent';

interface Flashcard {
  id: string;
  front_content: string;
  back_content: string;
  front_content_html?: string;
  back_content_html?: string;
  front_image_url?: string;
  back_image_url?: string;
}

interface SwipeableCardProps {
  card: Flashcard;
  isFlipped: boolean;
  isStarred: boolean;
  isSwipeInProgress: boolean;
  isSwipeDisabled?: boolean;
  onFlip: () => void;
  onStar: (cardId: string, isStarred: boolean) => void;
  onPanStart: () => void;
  onPanEnd: (event: any, info: PanInfo) => void;
  onModalStateChange?: (isModalOpen: boolean) => void;
}

/**
 * Swipeable card component with Framer Motion animations
 * Handles drag gestures and visual feedback for swipe actions
 */
const SwipeableCard: React.FC<SwipeableCardProps> = ({
  card,
  isFlipped,
  isStarred,
  isSwipeInProgress,
  isSwipeDisabled = false,
  onFlip,
  onStar,
  onPanStart,
  onPanEnd,
  onModalStateChange,
}) => {
  return (
    <motion.div
      key={card.id}
      className="w-full h-full touch-none relative z-20"
      style={{ touchAction: 'none' }}
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={{ 
        scale: 1, 
        opacity: isSwipeInProgress ? 0.8 : 1, 
        y: 0 
      }}
      exit={{ 
        scale: 0.8, 
        opacity: 0, 
        y: -50,
        transition: { duration: 0.2 }
      }}
      transition={{ 
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      drag={isSwipeDisabled ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onPanStart={isSwipeDisabled ? undefined : onPanStart}
      onPanEnd={isSwipeDisabled ? undefined : onPanEnd}
      whileDrag={{
        scale: 1.05,
        rotate: 0,
        transition: { duration: 0.1 }
      }}
      dragTransition={{
        bounceStiffness: 600,
        bounceDamping: 20
      }}
    >
      <motion.div
        className="w-full h-full"
        animate={{
          x: 0,
          rotate: 0
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40
        }}
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
          isStarred={isStarred}
          className="w-full h-full"
          onModalStateChange={onModalStateChange}
        />
      </motion.div>
    </motion.div>
  );
};

export default SwipeableCard;
