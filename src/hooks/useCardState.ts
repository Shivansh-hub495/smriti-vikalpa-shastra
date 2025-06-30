import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { CardHistory, StudyStats, CardStateReturn } from '@/types/study';

/**
 * @fileoverview Optimized card state management hook with performance best practices
 * @description Manages flashcard state, statistics, and user interactions with proper memoization
 * @author StudySession Refactor
 * @version 2.0.0
 */

/**
 * Custom hook for managing card state and study session logic with performance optimizations
 *
 * @description This hook provides comprehensive state management for flashcard study sessions,
 * including card navigation, statistics tracking, user interactions, and performance optimizations.
 *
 * @features
 * - **State Management**: Centralized state for current card, flip status, and session statistics
 * - **Performance**: Memoized calculations and stable function references with useCallback
 * - **Statistics**: Real-time tracking of correct/incorrect answers and session progress
 * - **History**: Complete history of user responses with timestamps and response times
 * - **Starred Cards**: User can star cards for later review
 * - **Undo Functionality**: Ability to undo the last card response
 * - **Session Control**: Restart session, navigate to specific cards
 *
 * @performance
 * - Uses useCallback for all action functions to prevent unnecessary re-renders
 * - Memoized derived state calculations (progress, session duration)
 * - Optimized state updates to minimize object creation
 * - Stable references with useRef for non-reactive data
 *
 * @example
 * ```tsx
 * const cardState = useCardState(flashcards.length);
 *
 * // Access current state
 * const { currentIndex, isFlipped, stats, progress } = cardState;
 *
 * // Use action functions
 * cardState.flipCard();
 * cardState.updateStats(true, cardId);
 * cardState.moveToNextCard();
 * ```
 *
 * @param totalCards - Total number of cards in the study session
 * @returns {CardStateReturn} Object containing state and action functions
 *
 * @author StudySession Refactor Team
 * @version 2.0.0
 * @since 2024-06-26
 */
export const useCardState = (totalCards: number): CardStateReturn => {
  // Refs for stable references that don't trigger re-renders
  const sessionStartTimeRef = useRef<Date>(new Date());
  const initialStatsRef = useRef<StudyStats>();

  // Initialize stats only once to prevent unnecessary re-creation
  if (!initialStatsRef.current) {
    initialStatsRef.current = {
      totalCards,
      currentIndex: 0,
      knowCount: 0,
      learningCount: 0,
      startTime: sessionStartTimeRef.current,
      learningCardIds: []
    };
  }

  // Core state with optimized initial values
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState<StudyStats>(() => initialStatsRef.current!);
  const [cardHistory, setCardHistory] = useState<CardHistory[]>([]);
  const [starredCards, setStarredCards] = useState<Set<string>>(() => new Set());
  const [cardStartTime, setCardStartTime] = useState<Date>(() => new Date());

  // Update totalCards in stats when it changes (memoized to prevent unnecessary updates)
  useEffect(() => {
    setStats(prev => ({ ...prev, totalCards }));
  }, [totalCards]);

  // Memoized derived state for performance optimization
  const progress = useMemo(() => ({
    percentage: totalCards > 0 ? (currentIndex / totalCards) * 100 : 0,
    remaining: Math.max(0, totalCards - currentIndex),
    isComplete: currentIndex >= totalCards,
  }), [currentIndex, totalCards]);

  const sessionDuration = useMemo(() => {
    return Math.round((Date.now() - sessionStartTimeRef.current.getTime()) / 1000 / 60);
  }, [currentIndex]); // Recalculate on card change

  /**
   * Flip the current card between front and back
   * Optimized with useCallback to prevent unnecessary re-renders
   */
  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  /**
   * Move to the next card and reset flip state
   * Optimized to batch state updates
   */
  const moveToNextCard = useCallback(() => {
    const now = new Date();
    setCurrentIndex(prev => prev + 1);
    setIsFlipped(false);
    setCardStartTime(now);
  }, []);

  /**
   * Update study statistics after a card response
   * Optimized to minimize object creation and array operations
   */
  const updateStats = useCallback((wasCorrect: boolean, cardId: string) => {
    setStats(prev => {
      const newLearningCardIds = !wasCorrect
        ? [...(prev.learningCardIds || []), cardId]
        : prev.learningCardIds || [];

      return {
        ...prev,
        currentIndex: prev.currentIndex + 1,
        knowCount: wasCorrect ? prev.knowCount + 1 : prev.knowCount,
        learningCount: !wasCorrect ? prev.learningCount + 1 : prev.learningCount,
        learningCardIds: newLearningCardIds
      };
    });
  }, []);

  /**
   * Add a card response to the history
   * Optimized with timestamp for better tracking
   */
  const addToHistory = useCallback((index: number, wasCorrect: boolean) => {
    const historyEntry: CardHistory = {
      index,
      wasCorrect,
      timestamp: new Date(),
      responseTime: Date.now() - cardStartTime.getTime()
    };
    setCardHistory(prev => [...prev, historyEntry]);
  }, [cardStartTime]);

  /**
   * Undo the last card response and restore previous state
   * Optimized to handle edge cases and batch state updates
   */
  const undoLastCard = useCallback(() => {
    if (cardHistory.length === 0) return;

    const lastCard = cardHistory[cardHistory.length - 1];
    const now = new Date();

    // Batch state updates for better performance
    setCurrentIndex(lastCard.index);
    setIsFlipped(false);
    setCardStartTime(now);

    setStats(prev => ({
      ...prev,
      currentIndex: lastCard.index,
      knowCount: lastCard.wasCorrect ? Math.max(0, prev.knowCount - 1) : prev.knowCount,
      learningCount: !lastCard.wasCorrect ? Math.max(0, prev.learningCount - 1) : prev.learningCount
    }));

    setCardHistory(prev => prev.slice(0, -1));
  }, [cardHistory]);

  /**
   * Restart the entire study session
   * Optimized to reset all state efficiently
   */
  const restartSession = useCallback(() => {
    const now = new Date();
    sessionStartTimeRef.current = now;

    // Batch all state updates
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStartTime(now);
    setCardHistory([]);
    setStarredCards(new Set());
    setStats(prev => ({
      ...prev,
      currentIndex: 0,
      knowCount: 0,
      learningCount: 0,
      startTime: now,
      learningCardIds: []
    }));
  }, []);

  /**
   * Toggle star status for a card
   * Optimized to minimize Set operations
   */
  const toggleStarCard = useCallback((cardId: string) => {
    setStarredCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  }, []);

  /**
   * Reset the card start time for response time tracking
   * Optimized with useCallback
   */
  const resetCardStartTime = useCallback(() => {
    setCardStartTime(new Date());
  }, []);

  // Memoize the return object to prevent unnecessary re-renders in consuming components
  const cardStateReturn = useMemo<CardStateReturn>(() => ({
    // State
    currentIndex,
    isFlipped,
    stats,
    cardHistory,
    starredCards,
    cardStartTime,

    // Derived state
    progress,
    sessionDuration,

    // Actions (already memoized with useCallback)
    flipCard,
    moveToNextCard,
    updateStats,
    addToHistory,
    undoLastCard,
    restartSession,
    toggleStarCard,
    resetCardStartTime,
    setCurrentIndex,
    setStats,
  }), [
    currentIndex,
    isFlipped,
    stats,
    cardHistory,
    starredCards,
    cardStartTime,
    progress,
    sessionDuration,
    flipCard,
    moveToNextCard,
    updateStats,
    addToHistory,
    undoLastCard,
    restartSession,
    toggleStarCard,
    resetCardStartTime,
    setCurrentIndex,
    setStats,
  ]);

  return cardStateReturn;
};
