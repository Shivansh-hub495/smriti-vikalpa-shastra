/**
 * @fileoverview QuestionPageHeader component for question management pages
 * @description Provides consistent header with navigation and breadcrumbs for question pages
 * @author Quiz Question Management System
 * @version 1.0.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quiz } from '@/types/quiz';

interface QuestionPageHeaderProps {
  /** The quiz context */
  quiz: Quiz;
  /** Current page mode */
  mode: 'create' | 'edit';
  /** Question number for create mode */
  questionNumber?: number;
  /** Whether there are unsaved changes */
  hasUnsavedChanges?: boolean;
  /** Custom back URL override */
  backUrl?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback for back navigation with unsaved changes handling */
  onBack?: () => void;
}

/**
 * QuestionPageHeader component for consistent navigation and context
 */
const QuestionPageHeader: React.FC<QuestionPageHeaderProps> = ({
  quiz,
  mode,
  questionNumber,
  hasUnsavedChanges = false,
  backUrl,
  className,
  onBack
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      const targetUrl = backUrl || `/quiz/${quiz.id}/edit`;
      navigate(targetUrl);
    }
  };

  const getPageTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create Question';
      case 'edit':
        return 'Edit Question';
      default:
        return 'Question';
    }
  };

  const getPageIcon = () => {
    switch (mode) {
      case 'create':
        return <Plus className="h-5 w-5 inline mr-2" />;
      case 'edit':
        return <Edit className="h-5 w-5 inline mr-2" />;
      default:
        return null;
    }
  };

  const getTitleColor = () => {
    switch (mode) {
      case 'create':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent';
      case 'edit':
        return 'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent';
      default:
        return 'text-gray-900 dark:text-gray-100';
    }
  };

  const getSubtitleText = () => {
    const baseText = mode === 'create' 
      ? `Question #${questionNumber || 1} • Press Ctrl+S to save`
      : 'Editing mode • Press Ctrl+S to save changes';
    
    return baseText;
  };

  return (
    <Card className={cn(
      "bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-xl",
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quiz
            </Button>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
            
            <div>
              <CardTitle className={cn("text-xl font-bold", getTitleColor())}>
                {getPageIcon()}
                {getPageTitle()}
              </CardTitle>
              
              <div className="mt-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {quiz.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {getSubtitleText()}
                </p>
              </div>
            </div>
          </div>
          
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">
                Unsaved changes
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};

export default QuestionPageHeader;