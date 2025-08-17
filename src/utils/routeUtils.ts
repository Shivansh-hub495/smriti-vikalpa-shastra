/**
 * @fileoverview Route utilities for quiz navigation and validation
 * @description Utility functions for handling quiz routes, deep linking, and URL parameters
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import { NavigateFunction } from 'react-router-dom';

/**
 * Quiz route paths
 */
export const QUIZ_ROUTES = {
  DASHBOARD: '/',
  FOLDER: (folderId: string) => `/folder/${folderId}`,
  CREATE_QUIZ: (folderId?: string) => folderId ? `/folder/${folderId}/create-quiz` : '/create-quiz',
  QUIZ_EDIT: (quizId: string) => `/quiz/${quizId}/edit`,
  QUIZ_TAKE: (quizId: string) => `/quiz/${quizId}/take`,
  QUIZ_HISTORY: (quizId: string) => `/quiz/${quizId}/history`,
  QUIZ_RESULTS: (quizId: string, attemptId: string) => `/quiz/${quizId}/results/${attemptId}`,
} as const;

/**
 * Validates if a route parameter is a valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates quiz route parameters
 */
export const validateQuizRouteParams = (params: {
  quizId?: string;
  folderId?: string;
  attemptId?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (params.quizId && !isValidUUID(params.quizId)) {
    errors.push('Invalid quiz ID format');
  }

  if (params.folderId && !isValidUUID(params.folderId)) {
    errors.push('Invalid folder ID format');
  }

  if (params.attemptId && !isValidUUID(params.attemptId)) {
    errors.push('Invalid attempt ID format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Safely navigates to a quiz route with validation
 */
export const navigateToQuizRoute = (
  navigate: NavigateFunction,
  route: string,
  options?: {
    replace?: boolean;
    state?: any;
  }
) => {
  try {
    navigate(route, options);
  } catch (error) {
    console.error('Navigation error:', error);
    // Fallback to dashboard
    navigate('/', { replace: true });
  }
};

/**
 * Builds quiz route with proper encoding
 */
export const buildQuizRoute = (
  routeTemplate: string,
  params: Record<string, string>
): string => {
  let route = routeTemplate;
  
  Object.entries(params).forEach(([key, value]) => {
    route = route.replace(`:${key}`, encodeURIComponent(value));
  });

  return route;
};

/**
 * Extracts quiz context from current location
 */
export const extractQuizContext = (pathname: string): {
  quizId?: string;
  folderId?: string;
  attemptId?: string;
  routeType?: 'create' | 'edit' | 'take' | 'history' | 'results' | 'folder';
} => {
  const segments = pathname.split('/').filter(Boolean);
  const context: ReturnType<typeof extractQuizContext> = {};

  // Match different route patterns
  if (segments[0] === 'folder' && segments[1]) {
    context.folderId = segments[1];
    context.routeType = 'folder';
    
    if (segments[2] === 'create-quiz') {
      context.routeType = 'create';
    }
  } else if (segments[0] === 'quiz' && segments[1]) {
    context.quizId = segments[1];
    
    if (segments[2] === 'edit') {
      context.routeType = 'edit';
    } else if (segments[2] === 'take') {
      context.routeType = 'take';
    } else if (segments[2] === 'history') {
      context.routeType = 'history';
    } else if (segments[2] === 'results' && segments[3]) {
      context.routeType = 'results';
      context.attemptId = segments[3];
    }
  } else if (segments[0] === 'create-quiz') {
    context.routeType = 'create';
  }

  return context;
};

/**
 * Generates breadcrumb items from route context
 */
export const generateBreadcrumbsFromRoute = (
  pathname: string,
  contextData?: {
    folderTitle?: string;
    quizTitle?: string;
  }
) => {
  const context = extractQuizContext(pathname);
  const breadcrumbs = [
    { label: 'Dashboard', href: '/', icon: 'Home' }
  ];

  if (context.folderId && contextData?.folderTitle) {
    breadcrumbs.push({
      label: contextData.folderTitle,
      href: QUIZ_ROUTES.FOLDER(context.folderId),
      icon: 'Folder'
    });
  }

  if (context.quizId && contextData?.quizTitle) {
    breadcrumbs.push({
      label: contextData.quizTitle,
      href: QUIZ_ROUTES.QUIZ_HISTORY(context.quizId),
      icon: 'FileQuestion'
    });
  }

  // Add current page
  switch (context.routeType) {
    case 'create':
      breadcrumbs.push({
        label: 'Create Quiz',
        icon: 'FileQuestion',
        isActive: true
      });
      break;
    case 'edit':
      breadcrumbs.push({
        label: 'Edit Quiz',
        icon: 'Edit',
        isActive: true
      });
      break;
    case 'take':
      breadcrumbs.push({
        label: 'Take Quiz',
        icon: 'Play',
        isActive: true
      });
      break;
    case 'history':
      breadcrumbs.push({
        label: 'Quiz History',
        icon: 'History',
        isActive: true
      });
      break;
    case 'results':
      breadcrumbs.push({
        label: 'Quiz Results',
        icon: 'BarChart3',
        isActive: true
      });
      break;
  }

  return breadcrumbs;
};

/**
 * Handles browser back navigation for quiz routes
 */
export const handleQuizBackNavigation = (
  navigate: NavigateFunction,
  context: {
    quizId?: string;
    folderId?: string;
    routeType?: string;
  }
) => {
  // Define navigation hierarchy
  switch (context.routeType) {
    case 'take':
    case 'edit':
    case 'history':
      // Go back to folder if available, otherwise dashboard
      if (context.folderId) {
        navigate(QUIZ_ROUTES.FOLDER(context.folderId));
      } else {
        navigate(QUIZ_ROUTES.DASHBOARD);
      }
      break;
    case 'results':
      // Go back to quiz history
      if (context.quizId) {
        navigate(QUIZ_ROUTES.QUIZ_HISTORY(context.quizId));
      } else {
        navigate(QUIZ_ROUTES.DASHBOARD);
      }
      break;
    case 'create':
      // Go back to folder
      if (context.folderId) {
        navigate(QUIZ_ROUTES.FOLDER(context.folderId));
      } else {
        navigate(QUIZ_ROUTES.DASHBOARD);
      }
      break;
    default:
      // Default back navigation
      navigate(-1);
  }
};

/**
 * Checks if user can access a quiz route based on permissions
 */
export const canAccessQuizRoute = (
  routeType: string,
  userRole: string,
  isOwner: boolean
): boolean => {
  switch (routeType) {
    case 'edit':
      return isOwner; // Only owner can edit
    case 'take':
    case 'history':
    case 'results':
      return true; // Anyone can take quiz or view their own history
    case 'create':
      return true; // Anyone can create quizzes
    default:
      return true;
  }
};

export default {
  QUIZ_ROUTES,
  isValidUUID,
  validateQuizRouteParams,
  navigateToQuizRoute,
  buildQuizRoute,
  extractQuizContext,
  generateBreadcrumbsFromRoute,
  handleQuizBackNavigation,
  canAccessQuizRoute
};