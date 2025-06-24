import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SwipeIndicatorProps {
  show: boolean;
  type: 'know' | 'learning' | null;
}

/**
 * Center indicator component that shows swipe feedback
 * Displays "KNOW" or "LEARNING" with appropriate styling
 */
const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({ show, type }) => {
  return (
    <AnimatePresence>
      {show && type && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ 
            duration: 0.3,
            type: "spring",
            stiffness: 400,
            damping: 25
          }}
          className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            exit={{ y: -20 }}
            className={`px-6 py-3 rounded-full font-semibold text-lg text-white shadow-lg ${
              type === 'know'
                ? 'bg-green-500/90'
                : 'bg-orange-500/90'
            }`}
          >
            {type === 'know' ? 'KNOW' : 'LEARNING'}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SwipeIndicator;
