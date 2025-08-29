/**
 * @fileoverview Loading States and Skeleton Components for Quiz System
 * @description Reusable loading indicators and skeleton screens for better UX
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import React from 'react';
import { Loader2, Brain, Clock, Users, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Generic loading spinner component
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

/**
 * Full page loading component
 */
interface PageLoadingProps {
  title?: string;
  description?: string;
}

export const PageLoading: React.FC<PageLoadingProps> = ({ 
  title = 'Loading...', 
  description 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Quiz card skeleton
 */
export const QuizCardSkeleton: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Question editor skeleton
 */
export const QuestionEditorSkeleton: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question Type Selector */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full" />
        </div>

        {/* Options/Answers */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-10 flex-1" />
            </div>
          ))}
        </div>

        {/* Explanation */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
        </div>

        {/* Action Button */}
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
};

/**
 * Quiz player skeleton
 */
export const QuizPlayerSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-20" />
              <div>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32 mt-1" />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-20 w-full" />
              
              {/* Answer options */}
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Skeleton className="h-10 w-24" />
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Quiz results skeleton
 */
export const QuizResultsSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 text-center">
              <Skeleton className="h-8 w-8 mx-auto mb-2" />
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Question Results */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Quiz attempt history skeleton
 */
export const QuizAttemptHistorySkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

/**
 * Inline loading component for buttons and small areas
 */
interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({ 
  text = 'Loading...', 
  className 
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
};

/**
 * Loading overlay for forms and modals
 */
interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  text = 'Loading...', 
  children 
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Stats loading skeleton
 */
export const StatsLoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { icon: Brain, label: 'Quizzes' },
        { icon: Clock, label: 'Time' },
        { icon: Users, label: 'Attempts' },
        { icon: BarChart3, label: 'Score' }
      ].map((stat, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-12" />
              </div>
              <div className="p-2 bg-muted rounded-lg">
                <stat.icon className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default {
  LoadingSpinner,
  PageLoading,
  QuizCardSkeleton,
  QuestionEditorSkeleton,
  QuizPlayerSkeleton,
  QuizResultsSkeleton,
  QuizAttemptHistorySkeleton,
  InlineLoading,
  LoadingOverlay,
  StatsLoadingSkeleton
};