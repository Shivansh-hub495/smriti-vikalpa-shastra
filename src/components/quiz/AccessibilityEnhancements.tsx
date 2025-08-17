import React, { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';

// Screen reader announcements hook
export const useScreenReader = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  return { announce };
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  onNext: () => void,
  onPrevious: () => void,
  onComplete: () => void,
  onExit: () => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with form inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'n':
        case 'N':
          event.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
        case 'p':
        case 'P':
          event.preventDefault();
          onPrevious();
          break;
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            onComplete();
          }
          break;
        case 'Escape':
          event.preventDefault();
          onExit();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrevious, onComplete, onExit]);
};

// Skip links component
export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-4 left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
      <a
        href="#quiz-navigation"
        className="fixed top-4 left-32 z-50 bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to navigation
      </a>
    </div>
  );
};

// Accessible timer component
interface AccessibleTimerProps {
  timeRemaining: number;
  totalTime: number;
  onTimeUp: () => void;
}

export const AccessibleTimer: React.FC<AccessibleTimerProps> = ({
  timeRemaining,
  totalTime,
  onTimeUp
}) => {
  const [lastAnnouncement, setLastAnnouncement] = useState<number>(0);
  const { announce } = useScreenReader();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Announce time warnings
    if (timeRemaining === 300 && lastAnnouncement !== 300) { // 5 minutes
      announce('5 minutes remaining', 'assertive');
      setLastAnnouncement(300);
    } else if (timeRemaining === 60 && lastAnnouncement !== 60) { // 1 minute
      announce('1 minute remaining', 'assertive');
      setLastAnnouncement(60);
    } else if (timeRemaining === 30 && lastAnnouncement !== 30) { // 30 seconds
      announce('30 seconds remaining', 'assertive');
      setLastAnnouncement(30);
    } else if (timeRemaining === 0) {
      announce('Time is up!', 'assertive');
      onTimeUp();
    }
  }, [timeRemaining, lastAnnouncement, announce, onTimeUp]);

  const percentage = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;
  const isLowTime = timeRemaining < 300; // Less than 5 minutes

  return (
    <div className="flex items-center space-x-2">
      <Clock className={`h-4 w-4 ${isLowTime ? 'text-red-500' : 'text-gray-500'}`} />
      <Badge 
        variant={isLowTime ? "destructive" : "secondary"}
        className={`font-mono ${isLowTime ? 'animate-pulse' : ''}`}
        aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
      >
        {formatTime(timeRemaining)}
      </Badge>
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        aria-label={`${Math.round(percentage)}% of time elapsed`}
      >
        {Math.round(percentage)}% of time elapsed
      </div>
    </div>
  );
};

// Accessible question navigation
interface AccessibleQuestionNavProps {
  currentIndex: number;
  totalQuestions: number;
  answeredQuestions: Set<number>;
  onNavigate: (index: number) => void;
  disabled?: boolean;
}

export const AccessibleQuestionNav: React.FC<AccessibleQuestionNavProps> = ({
  currentIndex,
  totalQuestions,
  answeredQuestions,
  onNavigate,
  disabled = false
}) => {
  return (
    <nav 
      id="quiz-navigation"
      aria-label="Question navigation"
      className="flex justify-center"
    >
      <div className="flex flex-wrap gap-2 max-w-2xl">
        {Array.from({ length: totalQuestions }, (_, index) => {
          const isAnswered = answeredQuestions.has(index);
          const isCurrent = index === currentIndex;
          
          return (
            <Button
              key={index}
              onClick={() => onNavigate(index)}
              disabled={disabled}
              variant={isCurrent ? "default" : "outline"}
              size="sm"
              className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-lg scale-110'
                  : isAnswered
                  ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-label={`Go to question ${index + 1}${isAnswered ? ' (answered)' : ''}${isCurrent ? ' (current)' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {index + 1}
            </Button>
          );
        })}
      </div>
    </nav>
  );
};