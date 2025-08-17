import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Flag, 
  Maximize2, 
  Minimize2,
  MoreHorizontal 
} from 'lucide-react';

// Mobile quiz header
interface MobileQuizHeaderProps {
  title: string;
  currentQuestion: number;
  totalQuestions: number;
  timeRemaining?: number;
  answeredCount: number;
  onExit: () => void;
}

export const MobileQuizHeader: React.FC<MobileQuizHeaderProps> = ({
  title,
  currentQuestion,
  totalQuestions,
  timeRemaining,
  answeredCount,
  onExit
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b shadow-sm">
      <div className="px-4 py-3">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-32">
              {title}
            </h1>
          </div>
          
          {timeRemaining !== undefined && (
            <Badge 
              variant={timeRemaining < 300 ? "destructive" : "secondary"}
              className="text-xs font-mono"
            >
              <Clock className="h-3 w-3 mr-1" />
              {formatTime(timeRemaining)}
            </Badge>
          )}
        </div>
        
        {/* Progress row */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Question {currentQuestion + 1} of {totalQuestions}</span>
          <span>{answeredCount}/{totalQuestions} answered</span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Responsive quiz card
interface ResponsiveQuizCardProps {
  children: React.ReactNode;
  fullHeight?: boolean;
  className?: string;
}

export const ResponsiveQuizCard: React.FC<ResponsiveQuizCardProps> = ({
  children,
  fullHeight = false,
  className = ""
}) => {
  return (
    <Card className={`
      w-full 
      ${fullHeight ? 'min-h-[calc(100vh-12rem)] md:min-h-0' : ''} 
      ${className}
    `}>
      {children}
    </Card>
  );
};

// Responsive quiz content wrapper
interface ResponsiveQuizContentProps {
  children: React.ReactNode;
}

export const ResponsiveQuizContent: React.FC<ResponsiveQuizContentProps> = ({
  children
}) => {
  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {children}
    </div>
  );
};

// Mobile question navigation
interface MobileQuestionNavProps {
  currentIndex: number;
  totalQuestions: number;
  answeredQuestions: Set<number>;
  onNavigate: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
  disabled?: boolean;
}

export const MobileQuestionNav: React.FC<MobileQuestionNavProps> = ({
  currentIndex,
  totalQuestions,
  answeredQuestions,
  onNavigate,
  onPrevious,
  onNext,
  onFinish,
  disabled = false
}) => {
  const isLastQuestion = currentIndex === totalQuestions - 1;
  
  return (
    <div className="space-y-4">
      {/* Question dots - scrollable on mobile */}
      <div className="flex justify-center">
        <div className="flex gap-1 overflow-x-auto max-w-full px-4 pb-2">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const isAnswered = answeredQuestions.has(index);
            const isCurrent = index === currentIndex;
            
            return (
              <button
                key={index}
                onClick={() => onNavigate(index)}
                disabled={disabled}
                className={`
                  flex-shrink-0 w-8 h-8 rounded-full text-xs font-medium transition-all duration-200
                  ${isCurrent
                    ? 'bg-blue-600 text-white shadow-lg scale-110'
                    : isAnswered
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}
                aria-label={`Question ${index + 1}${isAnswered ? ' (answered)' : ''}${isCurrent ? ' (current)' : ''}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentIndex === 0 || disabled}
          className="flex-1 max-w-32"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <div className="flex-1 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Swipe left/right to navigate
          </p>
        </div>
        
        {isLastQuestion ? (
          <Button
            onClick={onFinish}
            disabled={disabled}
            className="flex-1 max-w-32 bg-green-600 hover:bg-green-700 text-white"
          >
            <Flag className="h-4 w-4 mr-1" />
            Finish
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={disabled}
            className="flex-1 max-w-32"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Fullscreen toggle button
interface FullscreenToggleProps {
  onToggle: (isFullscreen: boolean) => void;
}

export const FullscreenToggle: React.FC<FullscreenToggleProps> = ({
  onToggle
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        onToggle(true);
      }).catch(() => {
        // Fullscreen failed
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        onToggle(false);
      }).catch(() => {
        // Exit fullscreen failed
      });
    }
  };
  
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      onToggle(isNowFullscreen);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onToggle]);
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleFullscreen}
      className="h-8 w-8 p-0"
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isFullscreen ? (
        <Minimize2 className="h-4 w-4" />
      ) : (
        <Maximize2 className="h-4 w-4" />
      )}
    </Button>
  );
};