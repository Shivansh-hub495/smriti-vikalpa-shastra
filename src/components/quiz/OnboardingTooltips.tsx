/**
 * @fileoverview Onboarding tooltips and help system for quiz features
 * @description Interactive tooltips and guided tours for new quiz features
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  HelpCircle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play,
  Brain,
  Clock,
  Target,
  BarChart3,
  Lightbulb,
  Keyboard,
  Smartphone,
  Eye,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Enhanced tooltip with rich content
 */
interface EnhancedTooltipProps {
  title: string;
  description: string;
  shortcut?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  showOnHover?: boolean;
  className?: string;
}

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({
  title,
  description,
  shortcut,
  icon,
  children,
  side = 'top',
  showOnHover = true,
  className
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className={cn("max-w-xs p-4", className)}
          sideOffset={8}
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {icon && <div className="text-primary">{icon}</div>}
              <h4 className="font-semibold text-sm">{title}</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
            {shortcut && (
              <div className="flex items-center space-x-1 pt-1">
                <Keyboard className="h-3 w-3 text-muted-foreground" />
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {shortcut}
                </Badge>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Onboarding tour step
 */
interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'right' | 'bottom' | 'left';
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Guided tour component
 */
interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  tourKey: string; // For localStorage persistence
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete,
  tourKey
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen || !steps[currentStep]) return;

    const target = document.querySelector(steps[currentStep].target) as HTMLElement;
    if (target) {
      setTargetElement(target);
      
      // Calculate tooltip position
      const rect = target.getBoundingClientRect();
      const position = steps[currentStep].position;
      
      let top = 0;
      let left = 0;
      
      switch (position) {
        case 'top':
          top = rect.top - 10;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
      }
      
      setTooltipPosition({ top, left });
      
      // Highlight target element
      target.style.position = 'relative';
      target.style.zIndex = '1001';
      target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
      target.style.borderRadius = '8px';
      
      // Scroll into view
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      if (target) {
        target.style.position = '';
        target.style.zIndex = '';
        target.style.boxShadow = '';
        target.style.borderRadius = '';
      }
    };
  }, [currentStep, isOpen, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`tour-completed-${tourKey}`, 'true');
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem(`tour-skipped-${tourKey}`, 'true');
    onClose();
  };

  if (!isOpen || !steps[currentStep]) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-1000" />
      
      {/* Tooltip */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed z-1002 max-w-sm"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Card className="shadow-xl border-2 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {step.icon && (
                    <div className="text-primary">{step.icon}</div>
                  )}
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
              
              {step.action && (
                <Button
                  onClick={step.action.onClick}
                  className="w-full"
                  size="sm"
                >
                  {step.action.label}
                </Button>
              )}
              
              {/* Progress indicator */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{currentStep + 1} of {steps.length}</span>
                <div className="flex space-x-1">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        index === currentStep ? "bg-primary" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
              
              {/* Navigation */}
              <div className="flex justify-between">
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-muted-foreground"
                  >
                    Skip Tour
                  </Button>
                </div>
                
                <Button
                  onClick={handleNext}
                  size="sm"
                  className="bg-primary"
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 ml-1" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

/**
 * Feature introduction modal
 */
interface FeatureIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour?: () => void;
  features: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;
}

export const FeatureIntroModal: React.FC<FeatureIntroModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  features
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            <span>Welcome to Quiz System!</span>
          </DialogTitle>
          <DialogDescription>
            Discover the powerful features that make creating and taking quizzes a breeze.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-primary mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Skip for Now
          </Button>
          {onStartTour && (
            <Button onClick={onStartTour} className="bg-primary">
              <Play className="h-4 w-4 mr-2" />
              Take the Tour
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Contextual help button
 */
interface ContextualHelpProps {
  title: string;
  content: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  title,
  content,
  position = 'top',
  className
}) => {
  return (
    <EnhancedTooltip
      title={title}
      description=""
      side={position}
      className={cn("max-w-md", className)}
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>
    </EnhancedTooltip>
  );
};

/**
 * Predefined quiz tour steps
 */
export const QUIZ_TOUR_STEPS: TourStep[] = [
  {
    id: 'quiz-creation',
    title: 'Create Your First Quiz',
    description: 'Click here to create a new quiz. You can add different types of questions and customize settings.',
    target: '[data-tour="create-quiz-button"]',
    position: 'bottom',
    icon: <Brain className="h-5 w-5" />
  },
  {
    id: 'question-types',
    title: 'Multiple Question Types',
    description: 'Choose from MCQ, Fill-in-the-blank, True/False, and Match-the-following questions.',
    target: '[data-tour="question-types"]',
    position: 'right',
    icon: <Target className="h-5 w-5" />
  },
  {
    id: 'quiz-settings',
    title: 'Customize Quiz Settings',
    description: 'Set time limits, enable shuffling, configure retakes, and more to tailor your quiz experience.',
    target: '[data-tour="quiz-settings"]',
    position: 'left',
    icon: <Clock className="h-5 w-5" />
  },
  {
    id: 'take-quiz',
    title: 'Take Your Quiz',
    description: 'Click here to start taking the quiz. Navigate between questions and track your progress.',
    target: '[data-tour="take-quiz-button"]',
    position: 'top',
    icon: <Play className="h-5 w-5" />
  },
  {
    id: 'view-results',
    title: 'View Detailed Results',
    description: 'After completing a quiz, see your score, correct answers, and performance analytics.',
    target: '[data-tour="quiz-results"]',
    position: 'bottom',
    icon: <BarChart3 className="h-5 w-5" />
  }
];

/**
 * Quiz features for intro modal
 */
export const QUIZ_FEATURES = [
  {
    icon: <Brain className="h-5 w-5" />,
    title: 'Multiple Question Types',
    description: 'Create diverse quizzes with MCQ, fill-in-the-blank, true/false, and matching questions.'
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: 'Time Management',
    description: 'Set time limits, track progress, and get warnings as time runs out.'
  },
  {
    icon: <Smartphone className="h-5 w-5" />,
    title: 'Mobile Optimized',
    description: 'Take quizzes seamlessly on any device with our responsive design.'
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Performance Analytics',
    description: 'Track your progress with detailed statistics and improvement trends.'
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: 'Accessibility Features',
    description: 'Full keyboard navigation, screen reader support, and customizable display options.'
  },
  {
    icon: <Volume2 className="h-5 w-5" />,
    title: 'Interactive Feedback',
    description: 'Get instant feedback with animations, sounds, and detailed explanations.'
  }
];

/**
 * Hook for managing onboarding state
 */
export const useOnboarding = (tourKey: string) => {
  const [showIntro, setShowIntro] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem(`intro-seen-${tourKey}`);
    const hasCompletedTour = localStorage.getItem(`tour-completed-${tourKey}`);
    const hasSkippedTour = localStorage.getItem(`tour-skipped-${tourKey}`);

    if (!hasSeenIntro && !hasCompletedTour && !hasSkippedTour) {
      setShowIntro(true);
    }
  }, [tourKey]);

  const startTour = () => {
    localStorage.setItem(`intro-seen-${tourKey}`, 'true');
    setShowIntro(false);
    setShowTour(true);
  };

  const skipIntro = () => {
    localStorage.setItem(`intro-seen-${tourKey}`, 'true');
    setShowIntro(false);
  };

  const completeTour = () => {
    setShowTour(false);
  };

  return {
    showIntro,
    showTour,
    startTour,
    skipIntro,
    completeTour,
    setShowTour
  };
};

export default {
  EnhancedTooltip,
  GuidedTour,
  FeatureIntroModal,
  ContextualHelp,
  useOnboarding,
  QUIZ_TOUR_STEPS,
  QUIZ_FEATURES
};