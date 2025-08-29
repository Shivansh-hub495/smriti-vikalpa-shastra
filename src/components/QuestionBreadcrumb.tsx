/**
 * @fileoverview QuestionBreadcrumb component for question management navigation
 * @description Provides breadcrumb navigation with quiz context for question pages
 * @author Quiz Question Management System
 * @version 1.0.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, Folder, Brain, Plus, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quiz } from '@/types/quiz';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

interface QuestionBreadcrumbProps {
  /** The quiz context */
  quiz: Quiz;
  /** Current page mode */
  mode: 'create' | 'edit';
  /** Question number for create mode */
  questionNumber?: number;
  /** Total question count */
  totalQuestions?: number;
  /** Folder title if quiz is in a folder */
  folderTitle?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * QuestionBreadcrumb component for question page navigation
 */
const QuestionBreadcrumb: React.FC<QuestionBreadcrumbProps> = ({
  quiz,
  mode,
  questionNumber,
  totalQuestions,
  folderTitle,
  className
}) => {
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: <Home className="h-4 w-4" />
    }
  ];

  // Add folder context if available
  if (quiz.folder_id && folderTitle) {
    breadcrumbItems.push({
      label: folderTitle,
      href: `/folder/${quiz.folder_id}`,
      icon: <Folder className="h-4 w-4" />
    });
  }

  // Add quiz context
  breadcrumbItems.push({
    label: quiz.title,
    href: `/quiz/${quiz.id}/edit`,
    icon: <Brain className="h-4 w-4" />
  });

  // Add current page context
  const currentPageItem = {
    label: mode === 'create' 
      ? `Create Question ${questionNumber ? `#${questionNumber}` : ''}`
      : 'Edit Question',
    icon: mode === 'create' 
      ? <Plus className="h-4 w-4" />
      : <Edit className="h-4 w-4" />,
    isActive: true
  };

  breadcrumbItems.push(currentPageItem);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Breadcrumb Navigation */}
      <nav 
        className="flex items-center space-x-1 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center space-x-1">
          {breadcrumbItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              )}
              
              {item.href && !item.isActive ? (
                <Link
                  to={item.href}
                  className="flex items-center space-x-1 hover:text-foreground transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <div 
                  className={cn(
                    "flex items-center space-x-1",
                    item.isActive ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Quiz Context Information */}
      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center space-x-1">
          <Brain className="h-3 w-3" />
          <span>
            {totalQuestions !== undefined 
              ? `${totalQuestions} question${totalQuestions !== 1 ? 's' : ''}`
              : 'Loading questions...'
            }
          </span>
        </span>
        
        {quiz.created_at && (
          <>
            <span>•</span>
            <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
          </>
        )}
        
        {quiz.updated_at && quiz.updated_at !== quiz.created_at && (
          <>
            <span>•</span>
            <span>Modified {new Date(quiz.updated_at).toLocaleDateString()}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionBreadcrumb;