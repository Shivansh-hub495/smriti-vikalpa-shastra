/**
 * @fileoverview Quiz form state utilities for preserving unsaved changes
 * @description Utilities for saving and restoring quiz form state during navigation
 * @author Quiz Question Management System
 * @version 1.0.0
 */

import type { QuizSettings } from '@/types/quiz';

interface QuizFormState {
  title: string;
  description: string;
  settings: QuizSettings;
  timestamp: number;
}

const STORAGE_KEY_PREFIX = 'quiz_form_state_';
const STATE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Save quiz form state to localStorage
 */
export const saveQuizFormState = (
  quizId: string,
  title: string,
  description: string,
  settings: QuizSettings
): void => {
  try {
    const state: QuizFormState = {
      title,
      description,
      settings,
      timestamp: Date.now()
    };

    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${quizId}`,
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn('Failed to save quiz form state:', error);
  }
};

/**
 * Load quiz form state from localStorage
 */
export const loadQuizFormState = (quizId: string): QuizFormState | null => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${quizId}`);
    if (!stored) return null;

    const state: QuizFormState = JSON.parse(stored);
    
    // Check if state has expired
    if (Date.now() - state.timestamp > STATE_EXPIRY_MS) {
      clearQuizFormState(quizId);
      return null;
    }

    return state;
  } catch (error) {
    console.warn('Failed to load quiz form state:', error);
    return null;
  }
};

/**
 * Clear quiz form state from localStorage
 */
export const clearQuizFormState = (quizId: string): void => {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${quizId}`);
  } catch (error) {
    console.warn('Failed to clear quiz form state:', error);
  }
};

/**
 * Check if there's saved form state for a quiz
 */
export const hasQuizFormState = (quizId: string): boolean => {
  return loadQuizFormState(quizId) !== null;
};

/**
 * Clean up expired form states
 */
export const cleanupExpiredFormStates = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const state: QuizFormState = JSON.parse(stored);
            if (now - state.timestamp > STATE_EXPIRY_MS) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove corrupted entries
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('Failed to cleanup expired form states:', error);
  }
};