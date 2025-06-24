import { useState, useCallback } from 'react';

interface CardHistory {
  index: number;
  wasCorrect: boolean;
}

interface StudyStats {
  totalCards: number;
  currentIndex: number;
  knowCount: number;
  learningCount: number;
  startTime: Date;
  learningCardIds?: string[];
}

interface CardStateReturn {
  currentIndex: number;
  isFlipped: boolean;
  stats: StudyStats;
  cardHistory: CardHistory[];
  starredCards: Set<string>;
  cardStartTime: Date;
  
  // Actions
  flipCard: () => void;
  moveToNextCard: () => void;
  updateStats: (wasCorrect: boolean, cardId: string) => void;
  addToHistory: (index: number, wasCorrect: boolean) => void;
  undoLastCard: () => void;
  restartSession: () => void;
  toggleStarCard: (cardId: string) => void;
  resetCardStartTime: () => void;
  setCurrentIndex: (index: number) => void;
  setStats: React.Dispatch<React.SetStateAction<StudyStats>>;
}

/**
 * Custom hook for managing card state and study session logic
 * Centralizes all card-related state management for better maintainability
 */
export const useCardState = (totalCards: number): CardStateReturn => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState<StudyStats>({
    totalCards,
    currentIndex: 0,
    knowCount: 0,
    learningCount: 0,
    startTime: new Date(),
    learningCardIds: []
  });
  const [cardHistory, setCardHistory] = useState<CardHistory[]>([]);
  const [starredCards, setStarredCards] = useState<Set<string>>(new Set());
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date());

  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const moveToNextCard = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
    setIsFlipped(false);
    setCardStartTime(new Date());
  }, []);

  const updateStats = useCallback((wasCorrect: boolean, cardId: string) => {
    setStats(prev => ({
      ...prev,
      currentIndex: prev.currentIndex + 1,
      knowCount: wasCorrect ? prev.knowCount + 1 : prev.knowCount,
      learningCount: !wasCorrect ? prev.learningCount + 1 : prev.learningCount,
      learningCardIds: !wasCorrect
        ? [...(prev.learningCardIds || []), cardId]
        : prev.learningCardIds || []
    }));
  }, []);

  const addToHistory = useCallback((index: number, wasCorrect: boolean) => {
    setCardHistory(prev => [...prev, { index, wasCorrect }]);
  }, []);

  const undoLastCard = useCallback(() => {
    if (cardHistory.length === 0) return;

    const lastCard = cardHistory[cardHistory.length - 1];
    
    setCurrentIndex(lastCard.index);
    setIsFlipped(false);
    setCardStartTime(new Date());
    
    setStats(prev => ({
      ...prev,
      currentIndex: lastCard.index,
      knowCount: lastCard.wasCorrect ? Math.max(0, prev.knowCount - 1) : prev.knowCount,
      learningCount: !lastCard.wasCorrect ? Math.max(0, prev.learningCount - 1) : prev.learningCount
    }));
    
    setCardHistory(prev => prev.slice(0, -1));
  }, [cardHistory]);

  const restartSession = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardStartTime(new Date());
    setCardHistory([]);
    setStats(prev => ({
      ...prev,
      currentIndex: 0,
      knowCount: 0,
      learningCount: 0,
      startTime: new Date(),
      learningCardIds: []
    }));
  }, []);

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

  const resetCardStartTime = useCallback(() => {
    setCardStartTime(new Date());
  }, []);

  return {
    currentIndex,
    isFlipped,
    stats,
    cardHistory,
    starredCards,
    cardStartTime,
    
    // Actions
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
  };
};
