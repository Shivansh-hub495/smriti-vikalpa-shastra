/**
 * @fileoverview Quiz session storage utilities
 * @description Utilities for persisting quiz session data in localStorage
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import type { QuestionAnswer } from '@/types/quiz';

export interface QuizSessionData {
  quizId: string;
  currentQuestionIndex: number;
  answers: QuestionAnswer[];
  startTime: string;
  timeRemaining: number | null;
  questionStartTime: string;
  shuffledQuestionIds?: string[];
}

const QUIZ_SESSION_KEY = 'quiz_session_';

/**
 * Save quiz session to localStorage
 */
export const saveQuizSession = (sessionData: QuizSessionData): void => {
  try {
    const key = `${QUIZ_SESSION_KEY}${sessionData.quizId}`;
    localStorage.setItem(key, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to save quiz session:', error);
  }
};

/**
 * Load quiz session from localStorage
 */
export const loadQuizSession = (quizId: string): QuizSessionData | null => {
  try {
    const key = `${QUIZ_SESSION_KEY}${quizId}`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load quiz session:', error);
  }
  return null;
};

/**
 * Clear quiz session from localStorage
 */
export const clearQuizSession = (quizId: string): void => {
  try {
    const key = `${QUIZ_SESSION_KEY}${quizId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear quiz session:', error);
  }
};

/**
 * Check if quiz session exists
 */
export const hasQuizSession = (quizId: string): boolean => {
  try {
    const key = `${QUIZ_SESSION_KEY}${quizId}`;
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error('Failed to check quiz session:', error);
    return false;
  }
};

/**
 * Clear all quiz sessions (cleanup utility)
 */
export const clearAllQuizSessions = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(QUIZ_SESSION_KEY)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear all quiz sessions:', error);
  }
};