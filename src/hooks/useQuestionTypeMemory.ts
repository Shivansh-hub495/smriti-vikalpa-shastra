/**
 * @fileoverview Question type memory hook
 * @description Manages remembering and persisting the last used question type
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import type { QuestionType } from '@/types/quiz';

const STORAGE_KEY = 'lastQuestionType';
const DEFAULT_TYPE: QuestionType = 'mcq';

interface QuestionTypeMemoryOptions {
  /** Default question type to use */
  defaultType?: QuestionType;
  /** Whether to persist to localStorage */
  persist?: boolean;
  /** Storage key for localStorage */
  storageKey?: string;
}

/**
 * Hook for managing question type memory
 */
export const useQuestionTypeMemory = (options: QuestionTypeMemoryOptions = {}) => {
  const {
    defaultType = DEFAULT_TYPE,
    persist = true,
    storageKey = STORAGE_KEY
  } = options;

  const [lastUsedType, setLastUsedType] = useState<QuestionType>(defaultType);

  // Load saved type on mount
  useEffect(() => {
    if (persist) {
      try {
        const savedType = localStorage.getItem(storageKey) as QuestionType;
        if (savedType && isValidQuestionType(savedType)) {
          setLastUsedType(savedType);
        }
      } catch (error) {
        console.warn('Failed to load saved question type:', error);
      }
    }
  }, [persist, storageKey]);

  // Save type when it changes
  const updateLastUsedType = useCallback((type: QuestionType) => {
    if (!isValidQuestionType(type)) {
      console.warn('Invalid question type:', type);
      return;
    }

    setLastUsedType(type);

    if (persist) {
      try {
        localStorage.setItem(storageKey, type);
      } catch (error) {
        console.warn('Failed to save question type:', error);
      }
    }
  }, [persist, storageKey]);

  // Get default data for a question type
  const getDefaultQuestionData = useCallback((type: QuestionType) => {
    switch (type) {
      case 'mcq':
        return { 
          options: ['', ''], 
          correctAnswer: 0,
          shuffleOptions: false
        };
      case 'fill_blank':
        return { 
          correctAnswers: [''], 
          caseSensitive: false,
          acceptPartialMatch: false
        };
      case 'true_false':
        return { 
          correctAnswer: true 
        };
      case 'match_following':
        return { 
          leftItems: [''], 
          rightItems: [''], 
          correctPairs: [{ left: 0, right: 0 }],
          shuffleItems: false
        };
      default:
        return { 
          options: ['', ''], 
          correctAnswer: 0,
          shuffleOptions: false
        };
    }
  }, []);

  // Clear saved type
  const clearSavedType = useCallback(() => {
    setLastUsedType(defaultType);
    
    if (persist) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to clear saved question type:', error);
      }
    }
  }, [defaultType, persist, storageKey]);

  // Get type display name
  const getTypeDisplayName = useCallback((type: QuestionType) => {
    switch (type) {
      case 'mcq':
        return 'Multiple Choice';
      case 'fill_blank':
        return 'Fill in the Blank';
      case 'true_false':
        return 'True/False';
      case 'match_following':
        return 'Match the Following';
      default:
        return 'Unknown';
    }
  }, []);

  // Get type icon
  const getTypeIcon = useCallback((type: QuestionType) => {
    switch (type) {
      case 'mcq':
        return '📝';
      case 'fill_blank':
        return '✏️';
      case 'true_false':
        return '✅';
      case 'match_following':
        return '🔗';
      default:
        return '❓';
    }
  }, []);

  // Get type color class
  const getTypeColorClass = useCallback((type: QuestionType) => {
    switch (type) {
      case 'mcq':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fill_blank':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'true_false':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'match_following':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  return {
    lastUsedType,
    updateLastUsedType,
    getDefaultQuestionData,
    clearSavedType,
    getTypeDisplayName,
    getTypeIcon,
    getTypeColorClass
  };
};

/**
 * Validate if a string is a valid question type
 */
function isValidQuestionType(type: string): type is QuestionType {
  return ['mcq', 'fill_blank', 'true_false', 'match_following'].includes(type);
}

/**
 * Hook for question type statistics
 */
export const useQuestionTypeStats = () => {
  const [typeUsageStats, setTypeUsageStats] = useState<Record<QuestionType, number>>({
    mcq: 0,
    fill_blank: 0,
    true_false: 0,
    match_following: 0
  });

  // Load stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('questionTypeStats');
      if (saved) {
        const stats = JSON.parse(saved);
        setTypeUsageStats(prev => ({ ...prev, ...stats }));
      }
    } catch (error) {
      console.warn('Failed to load question type stats:', error);
    }
  }, []);

  // Record usage of a question type
  const recordTypeUsage = useCallback((type: QuestionType) => {
    setTypeUsageStats(prev => {
      const newStats = {
        ...prev,
        [type]: (prev[type] || 0) + 1
      };

      // Save to localStorage
      try {
        localStorage.setItem('questionTypeStats', JSON.stringify(newStats));
      } catch (error) {
        console.warn('Failed to save question type stats:', error);
      }

      return newStats;
    });
  }, []);

  // Get most used question type
  const getMostUsedType = useCallback((): QuestionType => {
    const entries = Object.entries(typeUsageStats) as [QuestionType, number][];
    const sorted = entries.sort(([, a], [, b]) => b - a);
    return sorted[0]?.[0] || 'mcq';
  }, [typeUsageStats]);

  // Get usage percentage for a type
  const getTypeUsagePercentage = useCallback((type: QuestionType): number => {
    const total = Object.values(typeUsageStats).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;
    return Math.round((typeUsageStats[type] / total) * 100);
  }, [typeUsageStats]);

  // Clear stats
  const clearStats = useCallback(() => {
    const emptyStats = {
      mcq: 0,
      fill_blank: 0,
      true_false: 0,
      match_following: 0
    };
    
    setTypeUsageStats(emptyStats);
    
    try {
      localStorage.removeItem('questionTypeStats');
    } catch (error) {
      console.warn('Failed to clear question type stats:', error);
    }
  }, []);

  return {
    typeUsageStats,
    recordTypeUsage,
    getMostUsedType,
    getTypeUsagePercentage,
    clearStats
  };
};

export default useQuestionTypeMemory;