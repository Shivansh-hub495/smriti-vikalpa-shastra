/**
 * @fileoverview QuizBreadcrumb component for quiz navigation
 * @description Provides breadcrumb navigation for quiz-related pages
 * @author Quiz System Implementation
 * @version 1.0.0
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Folder, FileQuestion, History, Edit, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

interface QuizBreadcrumbProps {
  /** Custom breadcrumb items */
  items?: BreadcrumbItem[];
  /** Quiz title for context */
  quizTitle?: string;
  /** Folder title for context */
  folderTitle?: string;
  /** Folder ID for navigation */
  folderId?: string;
  /** Quiz ID for navigation */
  quizId?: string;
  /** Current page type */
  currentPage?: 'create' | 'edit' | 'take' | 'history' | 'results';
  /** Additional CSS classes */
  className?: string;
}

/**
 * QuizBreadcrumb component for navigation
 */
const QuizBreadcrumb: React.FC<QuizBreadcrumbProps> = ({
  items,
  quizTitle,
  folderTitle,
  folderId,
  quizId,
  currentPage,
  className
}) => {
  const location = useLocation();

  // Generate breadcrumb items based on current context
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items;

    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        href: '/',
        icon: <Home className="h-4 w-4" />
      }
    ];

    // Add folder context if available
    if (folderId && folderTitle) {
      breadcrumbs.push({
        label: folderTitle,
        href: `/folder/${folderId}`,
        icon: <Folder className="h-4 w-4" />
      });
    }

    // Add quiz context based on current page
    if (currentPage === 'create') {
      breadcrumbs.push({
        label: 'Create Quiz',
        icon: <FileQuestion className="h-4 w-4" />,
        isActive: true
      });
    } else if (quizId && quizTitle) {
      // Add quiz item
      breadcrumbs.push({
        label: quizTitle,
        href: `/quiz/${quizId}/history`,
        icon: <FileQuestion className="h-4 w-4" />
      });

      // Add current page context
      switch (currentPage) {
        case 'edit':
          breadcrumbs.push({
            label: 'Edit Quiz',
            icon: <Edit className="h-4 w-4" />,
            isActive: true
          });
          break;
        case 'take':
          breadcrumbs.push({
            label: 'Take Quiz',
            icon: <Play className="h-4 w-4" />,
            isActive: true
          });
          break;
        case 'history':
          breadcrumbs.push({
            label: 'Quiz History',
            icon: <History className="h-4 w-4" />,
            isActive: true
          });
          break;
        case 'results':
          breadcrumbs.push({
            label: 'Quiz Results',
            icon: <History className="h-4 w-4" />,
            isActive: true
          });
          break;
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs if there's only one item
  }

  return (
    <nav 
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
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
  );
};

export default QuizBreadcrumb;