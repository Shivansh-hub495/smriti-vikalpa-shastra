/**
 * @fileoverview Unit tests for Route Utilities
 * @description Tests for quiz route validation and navigation utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  QUIZ_ROUTES,
  validateQuizRouteParams,
  navigateToQuizRoute,
  buildQuizRoute,
  extractQuizContext,
  generateBreadcrumbsFromRoute
} from '../routeUtils';

// Mock navigate function
const mockNavigate = vi.fn();

describe('Route Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('QUIZ_ROUTES', () => {
    it('should generate correct route paths', () => {
      expect(QUIZ_ROUTES.DASHBOARD).toBe('/');
      expect(QUIZ_ROUTES.FOLDER('folder-1')).toBe('/folder/folder-1');
      expect(QUIZ_ROUTES.CREATE_QUIZ('folder-1')).toBe('/folder/folder-1/create-quiz');
      expect(QUIZ_ROUTES.CREATE_QUIZ()).toBe('/create-quiz');
      expect(QUIZ_ROUTES.QUIZ_EDIT('quiz-1')).toBe('/quiz/quiz-1/edit');
      expect(QUIZ_ROUTES.QUIZ_TAKE('quiz-1')).toBe('/quiz/quiz-1/take');
      expect(QUIZ_ROUTES.QUIZ_HISTORY('quiz-1')).toBe('/quiz/quiz-1/history');
      expect(QUIZ_ROUTES.QUIZ_RESULTS('quiz-1', 'attempt-1')).toBe('/quiz/quiz-1/results/attempt-1');
    });
  });

  describe('validateQuizRouteParams', () => {
    it('should validate correct UUID format', () => {
      const validParams = {
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        folderId: '987fcdeb-51a2-43d7-8f9e-123456789abc',
        attemptId: '456789ab-cdef-1234-5678-90abcdef1234'
      };

      const result = validateQuizRouteParams(validParams);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid UUID format', () => {
      const invalidParams = {
        quizId: 'invalid-uuid',
        folderId: 'also-invalid'
      };

      const result = validateQuizRouteParams(invalidParams);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid quiz ID format');
      expect(result.errors).toContain('Invalid folder ID format');
    });

    it('should handle missing optional parameters', () => {
      const params = {
        quizId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = validateQuizRouteParams(params);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate empty parameters object', () => {
      const result = validateQuizRouteParams({});
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('navigateToQuizRoute', () => {
    it('should navigate to valid route', () => {
      const validRoute = '/quiz/123e4567-e89b-12d3-a456-426614174000/take';
      
      navigateToQuizRoute(mockNavigate, validRoute);
      
      expect(mockNavigate).toHaveBeenCalledWith(validRoute);
    });

    it('should handle navigation errors gracefully', () => {
      const invalidRoute = '/quiz/invalid-id/take';
      
      // Should not throw error, but may log warning
      expect(() => navigateToQuizRoute(mockNavigate, invalidRoute)).not.toThrow();
      expect(mockNavigate).toHaveBeenCalledWith(invalidRoute);
    });
  });

  describe('buildQuizRoute', () => {
    it('should build route with parameters', () => {
      const template = '/quiz/:quizId/results/:attemptId';
      const params = {
        quizId: 'quiz-123',
        attemptId: 'attempt-456'
      };

      const result = buildQuizRoute(template, params);
      expect(result).toBe('/quiz/quiz-123/results/attempt-456');
    });

    it('should handle special characters in parameters', () => {
      const template = '/quiz/:quizId/take';
      const params = {
        quizId: 'quiz with spaces & symbols'
      };

      const result = buildQuizRoute(template, params);
      expect(result).toBe('/quiz/quiz%20with%20spaces%20%26%20symbols/take');
    });

    it('should handle missing parameters', () => {
      const template = '/quiz/:quizId/results/:attemptId';
      const params = {
        quizId: 'quiz-123'
        // attemptId missing
      };

      const result = buildQuizRoute(template, params);
      expect(result).toBe('/quiz/quiz-123/results/:attemptId');
    });
  });

  describe('extractQuizContext', () => {
    it('should extract folder context', () => {
      const pathname = '/folder/folder-123';
      const result = extractQuizContext(pathname);

      expect(result.folderId).toBe('folder-123');
      expect(result.routeType).toBe('folder');
    });

    it('should extract quiz creation context', () => {
      const pathname = '/folder/folder-123/create-quiz';
      const result = extractQuizContext(pathname);

      expect(result.folderId).toBe('folder-123');
      expect(result.routeType).toBe('create');
    });

    it('should extract quiz edit context', () => {
      const pathname = '/quiz/quiz-123/edit';
      const result = extractQuizContext(pathname);

      expect(result.quizId).toBe('quiz-123');
      expect(result.routeType).toBe('edit');
    });

    it('should extract quiz take context', () => {
      const pathname = '/quiz/quiz-123/take';
      const result = extractQuizContext(pathname);

      expect(result.quizId).toBe('quiz-123');
      expect(result.routeType).toBe('take');
    });

    it('should extract quiz results context', () => {
      const pathname = '/quiz/quiz-123/results/attempt-456';
      const result = extractQuizContext(pathname);

      expect(result.quizId).toBe('quiz-123');
      expect(result.attemptId).toBe('attempt-456');
      expect(result.routeType).toBe('results');
    });

    it('should extract standalone quiz creation context', () => {
      const pathname = '/create-quiz';
      const result = extractQuizContext(pathname);

      expect(result.routeType).toBe('create');
      expect(result.folderId).toBeUndefined();
    });

    it('should handle unknown routes', () => {
      const pathname = '/unknown/route';
      const result = extractQuizContext(pathname);

      expect(result.routeType).toBeUndefined();
      expect(result.quizId).toBeUndefined();
      expect(result.folderId).toBeUndefined();
    });

    it('should handle empty pathname', () => {
      const pathname = '';
      const result = extractQuizContext(pathname);

      expect(result.routeType).toBeUndefined();
    });

    it('should handle root pathname', () => {
      const pathname = '/';
      const result = extractQuizContext(pathname);

      expect(result.routeType).toBeUndefined();
    });
  });

  describe('generateBreadcrumbsFromRoute', () => {
    it('should generate breadcrumbs for folder view', () => {
      const pathname = '/folder/folder-123';
      const contextData = {
        folderTitle: 'My Study Folder'
      };

      const result = generateBreadcrumbsFromRoute(pathname, contextData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        label: 'Dashboard',
        href: '/',
        icon: 'Home'
      });
      expect(result[1]).toEqual({
        label: 'My Study Folder',
        href: '/folder/folder-123',
        icon: 'Folder'
      });
    });

    it('should generate breadcrumbs for quiz history', () => {
      const pathname = '/quiz/quiz-123/history';
      const contextData = {
        folderTitle: 'My Study Folder',
        quizTitle: 'Math Quiz'
      };

      const result = generateBreadcrumbsFromRoute(pathname, contextData);

      expect(result).toHaveLength(4);
      expect(result[0].label).toBe('Dashboard');
      expect(result[1].label).toBe('My Study Folder');
      expect(result[2].label).toBe('Math Quiz');
    });

    it('should generate breadcrumbs for quiz creation', () => {
      const pathname = '/folder/folder-123/create-quiz';
      const contextData = {
        folderTitle: 'My Study Folder'
      };

      const result = generateBreadcrumbsFromRoute(pathname, contextData);

      expect(result).toHaveLength(3);
      expect(result[2].label).toBe('Create Quiz');
    });

    it('should generate breadcrumbs for quiz taking', () => {
      const pathname = '/quiz/quiz-123/take';
      const contextData = {
        folderTitle: 'My Study Folder',
        quizTitle: 'Math Quiz'
      };

      const result = generateBreadcrumbsFromRoute(pathname, contextData);

      expect(result).toHaveLength(4);
      expect(result[3].label).toBe('Take Quiz');
    });

    it('should generate breadcrumbs for quiz editing', () => {
      const pathname = '/quiz/quiz-123/edit';
      const contextData = {
        folderTitle: 'My Study Folder',
        quizTitle: 'Math Quiz'
      };

      const result = generateBreadcrumbsFromRoute(pathname, contextData);

      expect(result).toHaveLength(4);
      expect(result[3].label).toBe('Edit Quiz');
    });

    it('should generate breadcrumbs for quiz results', () => {
      const pathname = '/quiz/quiz-123/results/attempt-456';
      const contextData = {
        folderTitle: 'My Study Folder',
        quizTitle: 'Math Quiz'
      };

      const result = generateBreadcrumbsFromRoute(pathname, contextData);

      expect(result).toHaveLength(4);
      expect(result[3].label).toBe('Quiz Results');
    });

    it('should handle missing context data', () => {
      const pathname = '/folder/folder-123';
      const result = generateBreadcrumbsFromRoute(pathname);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Dashboard');
    });

    it('should handle dashboard route', () => {
      const pathname = '/';
      const result = generateBreadcrumbsFromRoute(pathname);

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe('Dashboard');
    });
  });
});