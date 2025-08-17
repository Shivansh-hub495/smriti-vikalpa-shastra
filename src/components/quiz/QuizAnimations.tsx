import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Trophy, Star, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

interface AnimatedQuestionTransitionProps {
  children: React.ReactNode;
  questionIndex: number;
  direction: 'forward' | 'backward';
}

export const AnimatedQuestionTransition: React.FC<AnimatedQuestionTransitionProps> = ({
  children,
  questionIndex,
  direction
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={questionIndex}
        initial={{ 
          opacity: 0, 
          x: direction === 'forward' ? 50 : -50,
          scale: 0.95
        }}
        animate={{ 
          opacity: 1, 
          x: 0,
          scale: 1
        }}
        exit={{ 
          opacity: 0, 
          x: direction === 'forward' ? -50 : 50,
          scale: 0.95
        }}
        transition={{ 
          duration: 0.3,
          ease: "easeInOut"
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface AnswerFeedbackProps {
  isCorrect: boolean;
  show: boolean;
  onComplete: () => void;
}

export const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({
  isCorrect,
  show,
  onComplete
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className={`p-6 rounded-2xl shadow-2xl ${
              isCorrect 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              {isCorrect ? (
                <CheckCircle className="h-8 w-8" />
              ) : (
                <XCircle className="h-8 w-8" />
              )}
              <span className="text-xl font-bold">
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface QuizCompletionCelebrationProps {
  score: number;
  show: boolean;
  onComplete: () => void;
}

export const QuizCompletionCelebration: React.FC<QuizCompletionCelebrationProps> = ({
  score,
  show,
  onComplete
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const getScoreMessage = (score: number) => {
    if (score >= 90) return { message: "Outstanding!", icon: Trophy, color: "text-yellow-500" };
    if (score >= 80) return { message: "Excellent!", icon: Star, color: "text-blue-500" };
    if (score >= 70) return { message: "Great Job!", icon: Sparkles, color: "text-green-500" };
    if (score >= 60) return { message: "Good Work!", icon: CheckCircle, color: "text-purple-500" };
    return { message: "Keep Trying!", icon: CheckCircle, color: "text-gray-500" };
  };

  const { message, icon: Icon, color } = getScoreMessage(score);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl text-center max-w-md mx-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center`}
            >
              <Icon className={`h-10 w-10 ${color}`} />
            </motion.div>
            
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
            >
              {message}
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-600 dark:text-gray-400 mb-4"
            >
              You scored {score}%
            </motion.p>
            
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ delay: 0.7, duration: 1 }}
                className={`h-full rounded-full ${
                  score >= 80 
                    ? 'bg-gradient-to-r from-green-400 to-green-600' 
                    : score >= 60
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                    : 'bg-gradient-to-r from-red-400 to-red-600'
                }`}
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AnimatedProgressProps {
  value: number;
  max: number;
  className?: string;
  showPulse?: boolean;
}

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  value,
  max,
  className,
  showPulse = false
}) => {
  return (
    <div className={`relative ${className}`}>
      <Progress 
        value={value} 
        max={max}
        className={`transition-all duration-500 ${showPulse ? 'animate-pulse' : ''}`}
      />
      {showPulse && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 bg-red-500/20 rounded-full"
        />
      )}
    </div>
  );
};

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverScale?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  hoverScale = 1.05
}) => {
  return (
    <motion.div
      whileHover={{ scale: hoverScale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};