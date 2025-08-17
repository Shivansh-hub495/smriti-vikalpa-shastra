/**
 * @fileoverview Quiz Resume Dialog component
 * @description Dialog to ask user if they want to resume a saved quiz session
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, RotateCcw } from 'lucide-react';

interface QuizResumeDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog state changes */
  onOpenChange: (open: boolean) => void;
  /** Quiz title */
  quizTitle: string;
  /** Current question number */
  currentQuestion: number;
  /** Total questions */
  totalQuestions: number;
  /** Callback when user chooses to resume */
  onResume: () => void;
  /** Callback when user chooses to restart */
  onRestart: () => void;
}

/**
 * Quiz Resume Dialog component
 */
const QuizResumeDialog: React.FC<QuizResumeDialogProps> = ({
  open,
  onOpenChange,
  quizTitle,
  currentQuestion,
  totalQuestions,
  onResume,
  onRestart
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Resume Quiz Session?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You have a saved session for <strong>"{quizTitle}"</strong>.
            </p>
            <p>
              You were on question <strong>{currentQuestion + 1}</strong> of <strong>{totalQuestions}</strong>.
            </p>
            <p>
              Would you like to resume where you left off or start over?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onRestart} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Start Over
          </AlertDialogCancel>
          <AlertDialogAction onClick={onResume} className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Resume
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default QuizResumeDialog;