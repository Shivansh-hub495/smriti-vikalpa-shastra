/**
 * @fileoverview Lazy-loaded Quiz Components for Performance Optimization
 * @description Components that are loaded on-demand to improve initial page load
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Loader2 } from 'lucide-react';

// Direct re-exports (lazy loading removed)
export { default as LazyQuizCreationModal } from '@/components/QuizCreationModal';
export { default as LazyQuizEditPage } from '@/pages/QuizEdit';
export { default as LazyQuizTakingPage } from '@/pages/QuizTaking';
export { default as LazyQuizAttemptHistoryPage } from '@/pages/QuizAttemptHistoryPage';
export { default as LazyQuizPreviewModal } from '@/components/QuizPreviewModal';
export { default as LazyQuizDuplicateModal } from '@/components/QuizDuplicateModal';

// Loading skeletons for different components
export const QuizCardSkeleton: React.FC = () => (
  <Card className="w-full max-w-full min-w-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-white/20 dark:border-gray-700/20 shadow-xl rounded-2xl">
    <CardContent className="p-4 md:p-6 min-w-0">
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="p-2 md:p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full flex-shrink-0">
          <Brain className="h-5 w-5 md:h-6 md:w-6 text-pink-600 dark:text-pink-400" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      
      <div className="min-w-0 mb-2">
        <Skeleton className="h-6 w-3/4 mb-2" />
      </div>
      
      <div className="min-w-0 mb-4">
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      <div className="min-w-0 mb-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

export const QuizListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <QuizCardSkeleton key={index} />
    ))}
  </div>
);

export const QuizPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="flex-1">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  </div>
);

export const QuizModalSkeleton: React.FC = () => (
  <div className="space-y-4 p-6">
    <div className="flex items-center gap-2 mb-4">
      <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
      <Skeleton className="h-6 w-32" />
    </div>
    
    <div className="space-y-4">
      <div>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-24 w-full" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
    
    <div className="flex justify-end gap-2 pt-4">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

// Higher-order component for lazy loading with error boundary
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = <QuizPageSkeleton />,
  errorFallback = (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Failed to load component
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please refresh the page to try again
        </p>
      </div>
    </div>
  )
}) => (
  <>{children}</>
);

// Simple error boundary for lazy components
interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Preload functions for better UX
export const preloadQuizComponents = {
  // No-op now that lazy loading is removed
  creation: () => Promise.resolve(),
  edit: () => Promise.resolve(),
  taking: () => Promise.resolve(),
  history: () => Promise.resolve(),
  preview: () => Promise.resolve(),
  duplicate: () => Promise.resolve(),
};

// Hook for preloading components on user interaction
export const usePreloadQuizComponents = () => {
  const preloadOnHover = (componentName: keyof typeof preloadQuizComponents) => {
    return {
      onMouseEnter: () => preloadQuizComponents[componentName](),
      onFocus: () => preloadQuizComponents[componentName](),
    };
  };

  return { preloadOnHover };
};