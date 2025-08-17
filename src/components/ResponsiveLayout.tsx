import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveLayoutProps> = ({ 
  children, 
  className 
}) => {
  const { isMobile, isTablet } = useResponsive();

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
      isMobile ? 'p-2' : isTablet ? 'p-4' : 'p-6',
      className
    )}>
      <div className={cn(
        'mx-auto space-y-4',
        isMobile ? 'max-w-full' : isTablet ? 'max-w-6xl' : 'max-w-7xl',
        isMobile ? 'space-y-4' : 'space-y-6 sm:space-y-8'
      )}>
        {children}
      </div>
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  children, 
  className 
}) => {
  const { isMobile } = useResponsive();

  return (
    <div className={cn(
      isMobile 
        ? 'flex flex-col space-y-4' 
        : 'grid grid-cols-1 lg:grid-cols-2 gap-6',
      className
    )}>
      {children}
    </div>
  );
};

interface MobileOptimizedCardProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({ 
  children, 
  className 
}) => {
  const { isMobile } = useResponsive();

  return (
    <div className={cn(
      'bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl rounded-lg',
      isMobile ? 'mx-1' : '',
      className
    )}>
      {children}
    </div>
  );
};